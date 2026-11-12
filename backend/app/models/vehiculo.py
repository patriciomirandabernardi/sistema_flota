from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.orm import relationship

from app.database import Base


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    patente = Column(String, unique=True, index=True, nullable=False)
    marca_modelo = Column(String, nullable=False)
    anio = Column(Integer, nullable=True)
    categoria = Column(String, nullable=False)  # 'CAMIONES', 'SEMIS', 'UTILITARIOS'
    kilometraje_actual = Column(Integer, nullable=True)
    vencimiento_tecnica = Column(Date, nullable=True)

    ordenes = relationship(
        "OrdenMantenimiento",
        foreign_keys="[OrdenMantenimiento.vehiculo_id]",
        back_populates="vehiculo",
    )
    ordenes_como_semi = relationship(
        "OrdenMantenimiento",
        foreign_keys="[OrdenMantenimiento.semi_enganchado_id]",
        back_populates="semi_enganchado",
    )
