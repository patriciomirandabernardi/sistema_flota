from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class CatalogoTarea(Base):
    __tablename__ = "catalogo_tareas"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nombre_tarea = Column(String, nullable=False)  # ej: "Revisión de frenos"
    categoria_vehiculo = Column(String, nullable=False)  # 'CAMIONES', 'SEMIS', 'UTILITARIOS'
    sistema_id = Column(Integer, ForeignKey("sistemas_vehiculo.id"), nullable=False)
    tipo = Column(String, nullable=False)  # 'PREVENTIVO', 'CORRECTIVO'
    frecuencia_dias = Column(Integer, nullable=True)
    frecuencia_km = Column(Integer, nullable=True)
    frecuencia_viaje = Column(Boolean, default=False, nullable=False)

    sistema = relationship("SistemaVehiculo", back_populates="tareas")
