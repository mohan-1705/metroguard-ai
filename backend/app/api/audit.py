from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.audit import AuditEvent
import json

router = APIRouter()

@router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(200).all()
    results = []
    for e in events:
        meta = {}
        if e.metadata_json:
            try:
                meta = json.loads(e.metadata_json)
            except Exception:
                meta = {"raw": e.metadata_json}
        results.append({
            "id": e.id,
            "event_type": e.event_type,
            "incident_id": e.incident_id,
            "user": e.user,
            "timestamp": e.timestamp.isoformat(),
            "metadata": meta
        })
    return results
