from sqlalchemy import Column, String, DateTime
from app.db.database import Base
import datetime

class Train(Base):
    __tablename__ = "trains"
    train_id = Column(String, primary_key=True, index=True)
    line = Column(String, nullable=False)
    status = Column(String, default="NORMAL")  # NORMAL, WARNING, CRITICAL
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
