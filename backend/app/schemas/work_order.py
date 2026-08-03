from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TechnicianResponse(BaseModel):
    id: str
    name: str
    specialty: str
    status: str

    class Config:
        from_attributes = True

class WorkOrderBase(BaseModel):
    id: str
    incident_id: str
    task: str
    priority: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

class WorkOrderResponse(WorkOrderBase):
    technician_id: Optional[str] = None
    technician: Optional[TechnicianResponse] = None

    class Config:
        from_attributes = True

class WorkOrderCreate(BaseModel):
    incident_id: str
    task: str
    priority: str
    technician_id: Optional[str] = None

class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    technician_id: Optional[str] = None
