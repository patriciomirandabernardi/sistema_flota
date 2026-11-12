from pydantic import BaseModel, ConfigDict


class UsuarioBase(BaseModel):
    username: str
    rol: str  # 'ADMIN', 'LECTOR'


class UsuarioCreate(UsuarioBase):
    password: str  # texto plano; se hashea en el router


class UsuarioResponse(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
