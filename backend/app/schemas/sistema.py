from pydantic import BaseModel, ConfigDict


class SistemaBase(BaseModel):
    nombre: str  # 'Mecánica', 'Eléctrica', 'Hidráulica', 'Neumáticos'


class SistemaCreate(SistemaBase):
    pass


class SistemaResponse(SistemaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
