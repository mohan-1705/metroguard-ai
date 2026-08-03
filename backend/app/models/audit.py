from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_type = Column(String, nullable=False)  # SENSOR_RECEIVED, ANOMALY_DETECTED, etc.
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)
    user = Column(String, default="SYSTEM")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    metadata_json = Column(Text, nullable=True)  # JSON-serialized string

    incident = relationship("Incident", back_populates="audit_events")
