from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime

class Technician(Base):
    __tablename__ = "technicians"
    id = Column(String, primary_key=True, index=True)  # TECH-xxxx
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    status = Column(String, default="Available")  # Available, Busy

    work_orders = relationship("MaintenanceOrder", back_populates="technician")

class MaintenanceOrder(Base):
    __tablename__ = "maintenance_orders"
    id = Column(String, primary_key=True, index=True)  # WO-xxxx
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    task = Column(String, nullable=False)
    priority = Column(String, nullable=False)  # NORMAL, HIGH, CRITICAL
    technician_id = Column(String, ForeignKey("technicians.id"), nullable=True)
    status = Column(String, default="Created")  # Created, In Progress, Completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    incident = relationship("Incident", back_populates="work_orders")
    technician = relationship("Technician", back_populates="work_orders")
