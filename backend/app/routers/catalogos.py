from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.sistema import SistemaVehiculo
from app.models.tarea import CatalogoTarea
from app.models.usuario import Usuario
from app.schemas.sistema import SistemaCreate, SistemaResponse
from app.schemas.tarea import TareaCreate, TareaResponse, TareaUpdate

router = APIRouter(prefix="/catalogos", tags=["Catálogos"])


@router.get("/sistemas", response_model=list[SistemaResponse])
def listar_sistemas(
    db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    return db.query(SistemaVehiculo).all()


@router.post("/sistemas", response_model=SistemaResponse)
def crear_sistema(
    sistema: SistemaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_sistema = SistemaVehiculo(**sistema.model_dump())
    db.add(db_sistema)
    db.commit()
    db.refresh(db_sistema)
    return db_sistema


@router.delete("/sistemas/{sistema_id}", status_code=204)
def eliminar_sistema(
    sistema_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_sistema = db.query(SistemaVehiculo).filter(SistemaVehiculo.id == sistema_id).first()
    if db_sistema is None:
        raise HTTPException(status_code=404, detail="Sistema no encontrado")

    try:
        db.delete(db_sistema)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "No se puede eliminar el sistema: tiene tareas del catálogo "
                "asociadas. Elimine primero esas tareas."
            ),
        )
    return Response(status_code=204)


@router.get("/tareas", response_model=list[TareaResponse])
def listar_tareas(
    categoria_vehiculo: str | None = None,
    tipo: str | None = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(CatalogoTarea)
    if categoria_vehiculo is not None:
        query = query.filter(CatalogoTarea.categoria_vehiculo == categoria_vehiculo)
    if tipo is not None:
        query = query.filter(CatalogoTarea.tipo == tipo)
    return query.all()


@router.post("/tareas", response_model=TareaResponse)
def crear_tarea(
    tarea: TareaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_tarea = CatalogoTarea(**tarea.model_dump())
    db.add(db_tarea)
    db.commit()
    db.refresh(db_tarea)
    return db_tarea


@router.put("/tareas/{tarea_id}", response_model=TareaResponse)
def actualizar_tarea(
    tarea_id: int,
    tarea: TareaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_tarea = db.query(CatalogoTarea).filter(CatalogoTarea.id == tarea_id).first()
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    for campo, valor in tarea.model_dump().items():
        setattr(db_tarea, campo, valor)

    db.commit()
    db.refresh(db_tarea)
    return db_tarea


@router.delete("/tareas/{tarea_id}", status_code=204)
def eliminar_tarea(
    tarea_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_tarea = db.query(CatalogoTarea).filter(CatalogoTarea.id == tarea_id).first()
    if db_tarea is None:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    try:
        db.delete(db_tarea)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "No se puede eliminar la tarea: ya fue utilizada en una o más "
                "órdenes de mantenimiento (forma parte del historial)."
            ),
        )
    return Response(status_code=204)
