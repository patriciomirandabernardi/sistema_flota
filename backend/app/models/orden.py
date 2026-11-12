from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class DetalleOrdenTarea(Base):
    __tablename__ = "detalle_orden_tareas"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    orden_id = Column(
        Integer, ForeignKey("ordenes_mantenimiento.id", ondelete="CASCADE"), nullable=False
    )
    tarea_id = Column(
        Integer, ForeignKey("catalogo_tareas.id", ondelete="RESTRICT"), nullable=False
    )

    orden = relationship("OrdenMantenimiento", back_populates="tareas_realizadas")
    tarea = relationship("CatalogoTarea")


class OrdenMantenimiento(Base):
    __tablename__ = "ordenes_mantenimiento"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id", ondelete="RESTRICT"), nullable=False)
    fecha_servicio = Column(Date, nullable=False)
    kilometraje_servicio = Column(Integer, nullable=True)
    tipo_orden = Column(String, nullable=False)  # 'PREVENTIVO', 'CORRECTIVO'
    detalle_rotura = Column(String, nullable=True)
    observaciones = Column(String, nullable=True)
    lugar_ejecucion = Column(String, default="INTERNO", nullable=False)  # 'INTERNO', 'EXTERNO'
    proveedor_externo = Column(String, nullable=True)
    factura_pdf_url = Column(String, nullable=True)
    chofer = Column(String, nullable=True)
    semi_enganchado_id = Column(Integer, ForeignKey("vehiculos.id", ondelete="SET NULL"), nullable=True)

    vehiculo = relationship("Vehiculo", foreign_keys=[vehiculo_id])
    semi_enganchado = relationship("Vehiculo", foreign_keys=[semi_enganchado_id])
    tareas_realizadas = relationship(
        "DetalleOrdenTarea", back_populates="orden", cascade="all, delete-orphan"
    )
