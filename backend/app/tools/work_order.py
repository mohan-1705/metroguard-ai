import uuid
from sqlalchemy.orm import Session
from app.models.work_order import MaintenanceOrder

def create_work_order_tool(db: Session, incident_id: str, task: str, priority: str, technician_id: str = None) -> MaintenanceOrder:
    wo_id = f"WO-{uuid.uuid4().hex[:4].upper()}"
    wo = MaintenanceOrder(
        id=wo_id,
        incident_id=incident_id,
        task=task,
        priority=priority,
        technician_id=technician_id,
        status="Created"
    )
    db.add(wo)
    db.commit()
    db.refresh(wo)
    return wo
