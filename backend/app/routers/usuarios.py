from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.security import crear_token_acceso, get_password_hash, verify_password

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/registro", response_model=UsuarioResponse)
def registrar_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    db_usuario = Usuario(
        username=usuario.username,
        password_hash=get_password_hash(usuario.password),
        rol=usuario.rol,
    )
    db.add(db_usuario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="El username ya está registrado")
    db.refresh(db_usuario)
    return db_usuario


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    if usuario is None or not verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = crear_token_acceso(
        {"sub": usuario.username, "rol": usuario.rol, "id": usuario.id}
    )
    return {"access_token": token, "token_type": "bearer"}
