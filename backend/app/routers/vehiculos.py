from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import (
    VehiculoCreate,
    VehiculoResponse,
    VehiculoUpdate,
    VehiculoUpdateKm,
)

router = APIRouter(prefix="/vehiculos", tags=["Vehículos"])


@router.get("/", response_model=list[VehiculoResponse])
def listar_vehiculos(
    db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    return db.query(Vehiculo).all()


@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
def obtener_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    db_vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return db_vehiculo


@router.post("/", response_model=VehiculoResponse)
def crear_vehiculo(
    vehiculo: VehiculoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_vehiculo = Vehiculo(**vehiculo.model_dump())
    db.add(db_vehiculo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="La patente ya está registrada")
    db.refresh(db_vehiculo)
    return db_vehiculo


@router.patch("/{vehiculo_id}", response_model=VehiculoResponse)
def actualizar_vehiculo(
    vehiculo_id: int,
    vehiculo: VehiculoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    for campo, valor in vehiculo.model_dump(exclude_unset=True).items():
        if valor is not None:
            setattr(db_vehiculo, campo, valor)

    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo


@router.patch("/{vehiculo_id}/kilometraje", response_model=VehiculoResponse)
def actualizar_kilometraje(
    vehiculo_id: int,
    datos: VehiculoUpdateKm,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    # Regla de negocio: los SEMIS no tienen motor/odómetro propio, por lo
    # que no tiene sentido registrarles kilometraje (se valida también acá,
    # no solo en la UI, para que la regla no se pueda saltear llamando a la
    # API directamente).
    if db_vehiculo.categoria == "SEMIS":
        raise HTTPException(
            status_code=400,
            detail="Los vehículos de categoría SEMIS no registran kilometraje.",
        )

    db_vehiculo.kilometraje_actual = datos.kilometraje_actual
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo


@router.delete("/{vehiculo_id}", status_code=204)
def eliminar_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_vehiculo = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    try:
        db.delete(db_vehiculo)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "No se puede eliminar el vehículo: tiene órdenes de mantenimiento "
                "asociadas. Elimine primero esas órdenes o conserve el vehículo "
                "como registro histórico."
            ),
        )
    return Response(status_code=204)
