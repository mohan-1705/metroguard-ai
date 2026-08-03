from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    train_id = Column(String, ForeignKey("trains.train_id"), nullable=False)
    line = Column(String, nullable=False)
    station = Column(String, nullable=False)
    speed = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    axle_temperature = Column(Float, nullable=False)
    brake_temperature = Column(Float, nullable=False)
    track_temperature = Column(Float, nullable=False)
    status = Column(String, default="NORMAL")  # NORMAL, WARNING, CRITICAL
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    train = relationship("Train")
