from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ApprovalResponse(BaseModel):
    id: int
    incident_id: str
    reviewer: str
    decision: str
    comment: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
