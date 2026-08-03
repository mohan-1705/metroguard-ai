from pydantic import BaseModel
from datetime import datetime

class SensorReadingBase(BaseModel):
    train_id: str
    line: str
    station: str
    speed: float
    vibration: float
    axle_temperature: float
    brake_temperature: float
    track_temperature: float

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingResponse(SensorReadingBase):
    id: int
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
