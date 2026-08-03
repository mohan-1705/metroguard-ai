from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class IncidentBase(BaseModel):
    id: str
    train_id: str
    line: str
    station: str
    detected_issue: str
    severity: str
    status: str
    created_at: datetime

class IncidentResponse(IncidentBase):
    ai_confidence: Optional[float] = None
    ai_summary: Optional[str] = None
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True

class IncidentActionRequest(BaseModel):
    comment: Optional[str] = None
