from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, index=True)  # INC-xxxx
    train_id = Column(String, ForeignKey("trains.train_id"), nullable=False)
    line = Column(String, nullable=False)
    station = Column(String, nullable=False)
    detected_issue = Column(String, nullable=False)
    severity = Column(String, default="NORMAL")  # NORMAL, WARNING, HIGH, CRITICAL
    ai_confidence = Column(Float, nullable=True)
    ai_summary = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    status = Column(String, default="Awaiting Approval")  # Awaiting Approval, Approved, Rejected, In Progress, Resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    train = relationship("Train")
    work_orders = relationship("MaintenanceOrder", back_populates="incident", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="incident", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="incident", cascade="all, delete-orphan")
