from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.tarea import TareaResponse

KM_OBLIGATORIO_PREVENTIVO_MSG = "El kilometraje es obligatorio en tareas preventivas"


class DetalleOrdenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tarea_id: int
    tarea: Optional[TareaResponse] = None


class OrdenBase(BaseModel):
    fecha_servicio: date
    kilometraje_servicio: Optional[int] = None
    tipo_orden: str  # 'PREVENTIVO', 'CORRECTIVO'
    detalle_rotura: Optional[str] = None
    observaciones: Optional[str] = None
    lugar_ejecucion: str = "INTERNO"  # 'INTERNO', 'EXTERNO'
    proveedor_externo: Optional[str] = None
    chofer: Optional[str] = None


class OrdenCreate(OrdenBase):
    vehiculo_id: int
    semi_enganchado_id: Optional[int] = None
    tarea_ids: list[int]

    @model_validator(mode="after")
    def validar_kilometraje_preventivo(self) -> "OrdenCreate":
        # Regla de negocio: sin kilometraje no se puede calcular el próximo
        # ciclo de un preventivo, por eso es obligatorio solo en ese tipo.
        if self.tipo_orden == "PREVENTIVO" and self.kilometraje_servicio is None:
            raise ValueError(KM_OBLIGATORIO_PREVENTIVO_MSG)
        return self


class OrdenResponse(OrdenBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehiculo_id: int
    semi_enganchado_id: Optional[int] = None
    # Lo gestiona el backend al subir el archivo, no lo envía el cliente,
    # por eso está solo en la respuesta y no en OrdenBase/OrdenCreate.
    factura_pdf_url: Optional[str] = None
    tareas_realizadas: list[DetalleOrdenResponse] = []
