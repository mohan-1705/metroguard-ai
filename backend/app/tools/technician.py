from sqlalchemy.orm import Session
from app.models.work_order import Technician, MaintenanceOrder
from typing import List, Optional

def get_available_technicians_tool(db: Session, specialty: Optional[str] = None) -> List[Technician]:
    query = db.query(Technician).filter(Technician.status == "Available")
    if specialty:
        query = query.filter(Technician.specialty.like(f"%{specialty}%"))
    return query.all()

def assign_technician_tool(db: Session, work_order_id: str, technician_id: str) -> Optional[MaintenanceOrder]:
    wo = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == work_order_id).first()
    tech = db.query(Technician).filter(Technician.id == technician_id).first()
    if wo and tech:
        wo.technician_id = technician_id
        wo.status = "In Progress"
        tech.status = "Busy"
        db.commit()
        db.refresh(wo)
        return wo
    return None
