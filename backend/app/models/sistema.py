from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class SistemaVehiculo(Base):
    __tablename__ = "sistemas_vehiculo"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)  # 'Mecánica', 'Eléctrica', 'Hidráulica', 'Neumáticos'

    tareas = relationship("CatalogoTarea", back_populates="sistema")
