from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.sistema import SistemaResponse


class TareaBase(BaseModel):
    nombre_tarea: str
    categoria_vehiculo: str  # 'CAMIONES', 'SEMIS', 'UTILITARIOS'
    sistema_id: int
    tipo: str  # 'PREVENTIVO', 'CORRECTIVO'
    frecuencia_dias: Optional[int] = None
    frecuencia_km: Optional[int] = None
    frecuencia_viaje: bool = False


class TareaCreate(TareaBase):
    pass


class TareaUpdate(TareaBase):
    pass


class TareaResponse(TareaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sistema: Optional[SistemaResponse] = None
