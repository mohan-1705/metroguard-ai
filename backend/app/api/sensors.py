from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.sensor import SensorReadingCreate, SensorReadingResponse
from app.models.sensor import SensorReading
from app.agents.graph import agent_graph
from app.api.ws import manager
import logging

logger = logging.getLogger("metroguard.api.sensors")
router = APIRouter()

@router.get("/sensors", response_model=list[SensorReadingResponse])
def get_sensors(db: Session = Depends(get_db)):
    return db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(100).all()

@router.get("/sensors/{train_id}", response_model=list[SensorReadingResponse])
def get_sensor_history(train_id: str, db: Session = Depends(get_db)):
    return db.query(SensorReading).filter(SensorReading.train_id == train_id).order_by(SensorReading.timestamp.desc()).limit(50).all()

@router.post("/sensors/events")
async def post_sensor_event(event: SensorReadingCreate, db: Session = Depends(get_db)):
    # 1. Create DB record
    reading = SensorReading(
        train_id=event.train_id,
        line=event.line,
        station=event.station,
        speed=event.speed,
        vibration=event.vibration,
        axle_temperature=event.axle_temperature,
        brake_temperature=event.brake_temperature,
        track_temperature=event.track_temperature
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # Broadcast event
    await manager.broadcast({
        "event_type": "SENSOR_RECEIVED",
        "data": {
            "id": reading.id,
            "train_id": reading.train_id,
            "line": reading.line,
            "station": reading.station,
            "speed": reading.speed,
            "vibration": reading.vibration,
            "axle_temperature": reading.axle_temperature,
            "brake_temperature": reading.brake_temperature,
            "track_temperature": reading.track_temperature,
            "timestamp": reading.timestamp.isoformat()
        }
    })

    # Run LangGraph Agent
    state_input = {
        "sensor_event": {
            "train_id": event.train_id,
            "line": event.line,
            "station": event.station,
            "speed": event.speed,
            "vibration": event.vibration,
            "axle_temperature": event.axle_temperature,
            "brake_temperature": event.brake_temperature,
            "track_temperature": event.track_temperature
        },
        "anomalies": [],
        "retrieved_documents": [],
        "incident": None,
        "analysis": None,
        "severity": None,
        "confidence": None,
        "recommendation": None,
        "human_approved": None,
        "work_order_id": None,
        "audit_events": [],
        "errors": []
    }
    
    try:
        output = agent_graph.invoke(state_input)
    except Exception as e:
        logger.error(f"LangGraph execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI workflow execution error: {str(e)}")
    
    # Check if incident was created
    created_incident = output.get("incident")
    if created_incident:
        # Broadcast INCIDENT_CREATED
        await manager.broadcast({
            "event_type": "INCIDENT_CREATED",
            "data": created_incident
        })
        
        # Check if work order was also created (auto-approved workflow)
        wo_id = output.get("work_order_id")
        if wo_id:
            await manager.broadcast({
                "event_type": "WORK_ORDER_CREATED",
                "data": {
                    "work_order_id": wo_id,
                    "incident_id": created_incident["id"]
                }
            })

    return {
        "success": True,
        "message": "Sensor event processed.",
        "incident_created": created_incident is not None,
        "incident_id": created_incident["id"] if created_incident else None,
        "work_order_id": output.get("work_order_id")
    }
