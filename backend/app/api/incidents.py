from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.incident import IncidentResponse, IncidentActionRequest
from app.models.incident import Incident
from app.models.approval import Approval
from app.tools.work_order import create_work_order_tool
from app.tools.technician import get_available_technicians_tool, assign_technician_tool
from app.tools.notification import send_maintenance_alert_tool
from app.tools.audit_event import write_audit_event_tool
from app.tools.incident import update_incident_status_tool
from app.api.ws import manager
import logging

logger = logging.getLogger("metroguard.api.incidents")
router = APIRouter()

@router.get("/incidents", response_model=list[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()

@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("/incidents/{incident_id}/analyze")
async def analyze_incident(incident_id: str, db: Session = Depends(get_db)):
    # Re-run LLM assessment manually if needed
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Retrieve telemetry context
    from app.models.sensor import SensorReading
    sensor_reading = db.query(SensorReading).filter(SensorReading.train_id == inc.train_id).order_by(SensorReading.timestamp.desc()).first()
    
    telemetry = {}
    if sensor_reading:
        telemetry = {
            "train_id": sensor_reading.train_id,
            "line": sensor_reading.line,
            "station": sensor_reading.station,
            "speed": sensor_reading.speed,
            "vibration": sensor_reading.vibration,
            "axle_temperature": sensor_reading.axle_temperature,
            "brake_temperature": sensor_reading.brake_temperature,
            "track_temperature": sensor_reading.track_temperature
        }
    
    from app.rag.retriever import retrieve_evidence
    from app.llm.ollama_service import analyze_incident_with_llm
    
    docs = retrieve_evidence(f"{inc.detected_issue} {inc.station}")
    analysis_res = analyze_incident_with_llm(
        incident_id=inc.id,
        issue=inc.detected_issue,
        severity=inc.severity,
        telemetry=telemetry,
        documents=docs
    )
    
    inc.ai_confidence = analysis_res.get("confidence")
    inc.ai_summary = analysis_res.get("summary")
    inc.recommendation = analysis_res.get("recommendation")
    db.commit()
    db.refresh(inc)
    
    # Log audit
    write_audit_event_tool(db, "AI_ANALYSIS", incident_id=inc.id, metadata={"manually_triggered": True})
    
    # Broadcast update
    await manager.broadcast({
        "event_type": "INCIDENT_UPDATED",
        "data": {
            "id": inc.id,
            "status": inc.status,
            "severity": inc.severity,
            "ai_confidence": inc.ai_confidence,
            "ai_summary": inc.ai_summary,
            "recommendation": inc.recommendation
        }
    })
    
    return {"success": True, "incident": inc}

@router.post("/incidents/{incident_id}/approve")
async def approve_incident(incident_id: str, payload: IncidentActionRequest, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if inc.status in ["Approved", "In Progress", "Resolved"]:
        return {"success": True, "message": "Incident already approved/resolved", "work_order_created": False}

    # 1. Save approval record
    approval = Approval(
        incident_id=incident_id,
        reviewer="Operations Manager",
        decision="Approved",
        comment=payload.comment
    )
    db.add(approval)
    
    # Update incident state
    inc.status = "Approved"
    write_audit_event_tool(db, "APPROVED", incident_id=incident_id, metadata={"comment": payload.comment})
    db.commit()
    
    # 2. Trigger automated workflow since it has been approved
    task = inc.recommendation or f"Perform emergency inspection for: {inc.detected_issue}"
    wo = create_work_order_tool(db, incident_id=incident_id, task=task, priority=inc.severity)
    
    # Assign technician if available
    techs = get_available_technicians_tool(db)
    assigned_tech = None
    if techs:
        tech = techs[0]
        assign_technician_tool(db, wo.id, tech.id)
        assigned_tech = tech
        
        # Send simulated SMS/notification alert
        send_maintenance_alert_tool(tech.name, task, inc.station)
        write_audit_event_tool(db, "TECHNICIAN_ASSIGNED", incident_id=incident_id, metadata={"technician_id": tech.id, "technician_name": tech.name})
        
    inc.status = "In Progress"
    write_audit_event_tool(db, "WORK_ORDER_CREATED", incident_id=incident_id, metadata={"work_order_id": wo.id})
    db.commit()
    
    # Broadcast updates
    await manager.broadcast({
        "event_type": "INCIDENT_UPDATED",
        "data": {
            "id": inc.id,
            "status": inc.status
        }
    })
    
    await manager.broadcast({
        "event_type": "WORK_ORDER_CREATED",
        "data": {
            "work_order_id": wo.id,
            "incident_id": inc.id,
            "technician": tech.name if assigned_tech else None
        }
    })
    
    return {
        "success": True,
        "message": "Incident approved. Maintenance workflow automated.",
        "work_order_id": wo.id,
        "assigned_technician": tech.name if assigned_tech else None
    }

@router.post("/incidents/{incident_id}/reject")
async def reject_incident(incident_id: str, payload: IncidentActionRequest, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Save rejection approval record
    approval = Approval(
        incident_id=incident_id,
        reviewer="Operations Manager",
        decision="Rejected",
        comment=payload.comment
    )
    db.add(approval)
    
    inc.status = "Rejected"
    write_audit_event_tool(db, "REJECTED", incident_id=incident_id, metadata={"comment": payload.comment})
    db.commit()
    
    # Broadcast updates
    await manager.broadcast({
        "event_type": "INCIDENT_UPDATED",
        "data": {
            "id": inc.id,
            "status": inc.status
        }
    })
    
    return {
        "success": True,
        "message": "Incident rejection logged. Workflow aborted."
    }
