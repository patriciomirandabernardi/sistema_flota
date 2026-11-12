from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class VehiculoBase(BaseModel):
    patente: str
    marca_modelo: str
    anio: Optional[int] = None
    categoria: str  # 'CAMIONES', 'SEMIS', 'UTILITARIOS'
    kilometraje_actual: Optional[int] = None
    vencimiento_tecnica: Optional[date] = None


class VehiculoCreate(VehiculoBase):
    pass


class VehiculoUpdate(BaseModel):
    patente: Optional[str] = None
    marca_modelo: Optional[str] = None
    anio: Optional[int] = None
    categoria: Optional[str] = None
    kilometraje_actual: Optional[int] = None
    vencimiento_tecnica: Optional[date] = None


class VehiculoResponse(VehiculoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class VehiculoUpdateKm(BaseModel):
    kilometraje_actual: int
