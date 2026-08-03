from sqlalchemy.orm import Session
from app.models.incident import Incident
from typing import Optional

def update_incident_status_tool(db: Session, incident_id: str, status: str) -> Optional[Incident]:
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        inc.status = status
        db.commit()
        db.refresh(inc)
        return inc
    return None
