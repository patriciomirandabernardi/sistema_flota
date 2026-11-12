import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.orden import DetalleOrdenTarea, OrdenMantenimiento
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.orden import OrdenCreate, OrdenResponse
from app.storage import FACTURAS_DIR, FACTURAS_URL_PREFIX, asegurar_directorios

router = APIRouter(prefix="/ordenes", tags=["Órdenes"])


def _ruta_fisica_factura(factura_pdf_url: str) -> Path:
    """
    Traduce el valor guardado en la base (ej: "/facturas/factura_orden_7.pdf")
    a la ruta física del archivo.

    Se usa solo el nombre del archivo (Path().name) y se resuelve dentro de
    FACTURAS_DIR para que un valor manipulado en la base no pueda apuntar a
    otra carpeta del disco (path traversal).
    """
    nombre_archivo = Path(factura_pdf_url).name
    return FACTURAS_DIR / nombre_archivo


def _actualizar_kilometraje_vehiculo(db: Session, vehiculo_id: int, km_orden: int | None) -> None:
    # Regla de negocio: el odómetro del vehículo solo avanza. Si la orden trae
    # un km menor o igual al actual (ej: error de tipeo o carga de una orden
    # vieja), no se toca el vehículo.
    if km_orden is None:
        return
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if vehiculo is None or vehiculo.categoria == "SEMIS":
        return
    if vehiculo.kilometraje_actual is None or km_orden > vehiculo.kilometraje_actual:
        vehiculo.kilometraje_actual = km_orden


@router.get("/", response_model=list[OrdenResponse])
def listar_ordenes(
    vehiculo_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(OrdenMantenimiento)
    if vehiculo_id is not None:
        query = query.filter(OrdenMantenimiento.vehiculo_id == vehiculo_id)
    return query.all()


@router.post("/", response_model=OrdenResponse)
def crear_orden(
    orden: OrdenCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    datos_orden = orden.model_dump(exclude={"tarea_ids"})
    tarea_ids = orden.tarea_ids

    db_orden = OrdenMantenimiento(**datos_orden)
    db.add(db_orden)

    try:
        db.flush()

        for tarea_id in tarea_ids:
            db.add(DetalleOrdenTarea(orden_id=db_orden.id, tarea_id=tarea_id))

        _actualizar_kilometraje_vehiculo(db, orden.vehiculo_id, orden.kilometraje_servicio)

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Datos inválidos: verifique que el vehículo, el semi enganchado y las tareas existan",
        )

    db.refresh(db_orden)
    return db_orden


@router.post("/{orden_id}/factura", response_model=OrdenResponse)
def subir_factura(
    orden_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_orden = db.query(OrdenMantenimiento).filter(OrdenMantenimiento.id == orden_id).first()
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    nombre_original = (file.filename or "").lower()
    es_pdf = file.content_type == "application/pdf" or nombre_original.endswith(".pdf")
    if not es_pdf:
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser un PDF.",
        )

    asegurar_directorios()

    # Nombre determinístico por orden: si se vuelve a subir una factura para
    # la misma orden, se reemplaza el archivo anterior en lugar de acumular
    # copias huérfanas en el disco.
    nombre_archivo = f"factura_orden_{orden_id}.pdf"
    destino = FACTURAS_DIR / nombre_archivo

    try:
        with open(destino, "wb") as archivo_destino:
            shutil.copyfileobj(file.file, archivo_destino)
    finally:
        file.file.close()

    db_orden.factura_pdf_url = f"{FACTURAS_URL_PREFIX}/{nombre_archivo}"
    db.commit()
    db.refresh(db_orden)
    return db_orden


@router.get("/{orden_id}/factura/pdf")
def descargar_factura(
    orden_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_orden = db.query(OrdenMantenimiento).filter(OrdenMantenimiento.id == orden_id).first()
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if not db_orden.factura_pdf_url:
        raise HTTPException(
            status_code=404, detail="La orden no tiene una factura adjunta."
        )

    ruta = _ruta_fisica_factura(db_orden.factura_pdf_url)
    if not ruta.is_file():
        raise HTTPException(
            status_code=404,
            detail="El archivo de la factura no se encuentra en el servidor.",
        )

    return FileResponse(
        path=ruta,
        media_type="application/pdf",
        filename=f"factura_orden_{orden_id}.pdf",
    )


@router.delete("/{orden_id}", status_code=204)
def eliminar_orden(
    orden_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_orden = db.query(OrdenMantenimiento).filter(OrdenMantenimiento.id == orden_id).first()
    if db_orden is None:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # Se elimina también el PDF de la factura para no dejar archivos
    # huérfanos en el disco. Si el borrado del archivo falla (permisos,
    # archivo ya inexistente, etc.) no se aborta la operación: el registro
    # de la orden igual debe poder eliminarse.
    if db_orden.factura_pdf_url:
        ruta = _ruta_fisica_factura(db_orden.factura_pdf_url)
        try:
            if ruta.is_file():
                os.remove(ruta)
        except OSError:
            pass

    # Se borra el objeto ORM (no un bulk-delete por query) para que
    # SQLAlchemy dispare el cascade="all, delete-orphan" configurado en
    # la relación "tareas_realizadas" y elimine también sus detalles.
    db.delete(db_orden)
    db.commit()
    return Response(status_code=204)
