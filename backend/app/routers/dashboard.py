from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.orden import DetalleOrdenTarea, OrdenMantenimiento
from app.models.tarea import CatalogoTarea
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

UMBRAL_KM_PROXIMO = 1000
UMBRAL_DIAS_PROXIMO = 15
MAX_ALERTAS_PREVENTIVAS = 25


def _calcular_alertas_preventivas(db: Session) -> list[dict]:
    """
    Para cada vehículo (excepto SEMIS) y cada tarea preventiva aplicable a su
    categoría, busca la última orden en la que esa tarea fue realizada y
    compara el kilometraje/fecha de esa orden contra el estado actual del
    vehículo, usando frecuencia_km y/o frecuencia_dias del catálogo.

    Si una tarea nunca fue realizada para un vehículo, se omite (sin una
    orden de referencia no hay forma de calcular un vencimiento real; listar
    "nunca hecho" como si fuera un dato calculado sería engañoso).
    """
    hoy = date.today()
    alertas: list[dict] = []

    vehiculos = db.query(Vehiculo).filter(Vehiculo.categoria != "SEMIS").all()

    for vehiculo in vehiculos:
        tareas_preventivas = (
            db.query(CatalogoTarea)
            .filter(
                CatalogoTarea.categoria_vehiculo == vehiculo.categoria,
                CatalogoTarea.tipo == "PREVENTIVO",
            )
            .all()
        )

        for tarea in tareas_preventivas:
            if tarea.frecuencia_km is None and tarea.frecuencia_dias is None:
                continue  # tarea sin ninguna frecuencia configurada, no hay nada que calcular

            ultimo_detalle = (
                db.query(DetalleOrdenTarea)
                .join(OrdenMantenimiento)
                .filter(
                    OrdenMantenimiento.vehiculo_id == vehiculo.id,
                    DetalleOrdenTarea.tarea_id == tarea.id,
                )
                .order_by(desc(OrdenMantenimiento.fecha_servicio))
                .first()
            )
            if ultimo_detalle is None:
                continue  # nunca se realizó: sin línea de base, no se calcula

            ultima_orden = ultimo_detalle.orden

            # Criterio por kilometraje
            if (
                tarea.frecuencia_km is not None
                and ultima_orden.kilometraje_servicio is not None
                and vehiculo.kilometraje_actual is not None
            ):
                km_objetivo = ultima_orden.kilometraje_servicio + tarea.frecuencia_km
                km_restantes = km_objetivo - vehiculo.kilometraje_actual

                estado = None
                if km_restantes <= 0:
                    estado = "VENCIDO"
                elif km_restantes <= UMBRAL_KM_PROXIMO:
                    estado = "PROXIMO"

                if estado:
                    alertas.append(
                        {
                            "vehiculo_id": vehiculo.id,
                            "patente": vehiculo.patente,
                            "tarea_id": tarea.id,
                            "nombre_tarea": tarea.nombre_tarea,
                            "criterio": "KM",
                            "estado": estado,
                            "detalle": (
                                f"Vencido hace {abs(km_restantes)} km"
                                if km_restantes <= 0
                                else f"Faltan {km_restantes} km"
                            ),
                            "orden_valor": km_restantes,
                        }
                    )

            # Criterio por días
            if tarea.frecuencia_dias is not None:
                fecha_objetivo = ultima_orden.fecha_servicio + timedelta(
                    days=tarea.frecuencia_dias
                )
                dias_restantes = (fecha_objetivo - hoy).days

                estado = None
                if dias_restantes <= 0:
                    estado = "VENCIDO"
                elif dias_restantes <= UMBRAL_DIAS_PROXIMO:
                    estado = "PROXIMO"

                if estado:
                    alertas.append(
                        {
                            "vehiculo_id": vehiculo.id,
                            "patente": vehiculo.patente,
                            "tarea_id": tarea.id,
                            "nombre_tarea": tarea.nombre_tarea,
                            "criterio": "DIAS",
                            "estado": estado,
                            "detalle": (
                                f"Vencido hace {abs(dias_restantes)} días"
                                if dias_restantes <= 0
                                else f"Faltan {dias_restantes} días"
                            ),
                            "orden_valor": dias_restantes,
                        }
                    )

    # Vencidos primero; dentro de cada grupo, lo más urgente primero
    alertas.sort(key=lambda a: (a["estado"] != "VENCIDO", a["orden_valor"]))
    for alerta in alertas:
        del alerta["orden_valor"]  # campo interno solo para ordenar

    return alertas[:MAX_ALERTAS_PREVENTIVAS]


@router.get("/stats")
def obtener_estadisticas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    hace_30_dias = hoy - timedelta(days=30)
    en_30_dias = hoy + timedelta(days=30)

    total_vehiculos = db.query(Vehiculo).count()

    ordenes_mes = (
        db.query(OrdenMantenimiento)
        .filter(OrdenMantenimiento.fecha_servicio >= hace_30_dias)
        .count()
    )

    vehiculos_alerta = (
        db.query(Vehiculo)
        .filter(
            Vehiculo.vencimiento_tecnica.isnot(None),
            Vehiculo.vencimiento_tecnica <= en_30_dias,
        )
        .all()
    )

    alertas_tecnica = [
        {
            "id": vehiculo.id,
            "patente": vehiculo.patente,
            "vencimiento_tecnica": vehiculo.vencimiento_tecnica,
        }
        for vehiculo in vehiculos_alerta
    ]

    alertas_preventivas = _calcular_alertas_preventivas(db)

    return {
        "total_vehiculos": total_vehiculos,
        "ordenes_mes": ordenes_mes,
        "alertas_tecnica": alertas_tecnica,
        "alertas_preventivas": alertas_preventivas,
    }
