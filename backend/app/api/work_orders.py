from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.work_order import WorkOrderResponse, WorkOrderUpdate
from app.models.work_order import MaintenanceOrder, Technician
from app.models.incident import Incident
from app.tools.audit_event import write_audit_event_tool
from app.api.ws import manager
import datetime

router = APIRouter()

@router.get("/work-orders", response_model=list[WorkOrderResponse])
def get_work_orders(db: Session = Depends(get_db)):
    return db.query(MaintenanceOrder).order_by(MaintenanceOrder.created_at.desc()).all()

@router.get("/work-orders/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(work_order_id: str, db: Session = Depends(get_db)):
    wo = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return wo

@router.put("/work-orders/{work_order_id}", response_model=WorkOrderResponse)
async def update_work_order(work_order_id: str, payload: WorkOrderUpdate, db: Session = Depends(get_db)):
    wo = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
        
    if payload.status:
        wo.status = payload.status
        if payload.status == "Completed":
            wo.resolved_at = datetime.datetime.utcnow()
            if wo.technician_id:
                tech = db.query(Technician).filter(Technician.id == wo.technician_id).first()
                if tech:
                    tech.status = "Available"
            
            # Auto-resolve the incident
            inc = db.query(Incident).filter(Incident.id == wo.incident_id).first()
            if inc:
                inc.status = "Resolved"
                await manager.broadcast({
                    "event_type": "INCIDENT_UPDATED",
                    "data": {
                        "id": inc.id,
                        "status": "Resolved"
                    }
                })
                write_audit_event_tool(db, "INCIDENT_RESOLVED", incident_id=inc.id)
                
            write_audit_event_tool(db, "WORK_ORDER_COMPLETED", incident_id=wo.incident_id, metadata={"work_order_id": wo.id})
            
        elif payload.status == "In Progress":
            write_audit_event_tool(db, "WORK_ORDER_IN_PROGRESS", incident_id=wo.incident_id, metadata={"work_order_id": wo.id})

    if payload.technician_id:
        if wo.technician_id:
            old_tech = db.query(Technician).filter(Technician.id == wo.technician_id).first()
            if old_tech:
                old_tech.status = "Available"
        
        new_tech = db.query(Technician).filter(Technician.id == payload.technician_id).first()
        if new_tech:
            new_tech.status = "Busy"
            wo.technician_id = payload.technician_id
            write_audit_event_tool(db, "TECHNICIAN_ASSIGNED", incident_id=wo.incident_id, metadata={"work_order_id": wo.id, "technician_id": new_tech.id})

    db.commit()
    db.refresh(wo)
    
    await manager.broadcast({
        "event_type": "WORK_ORDER_UPDATED",
        "data": {
            "id": wo.id,
            "status": wo.status,
            "technician_id": wo.technician_id
        }
    })
    
    return wo
