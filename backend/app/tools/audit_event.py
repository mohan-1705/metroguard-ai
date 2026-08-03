import json
from sqlalchemy.orm import Session
from app.models.audit import AuditEvent

def write_audit_event_tool(db: Session, event_type: str, incident_id: str = None, user: str = "SYSTEM", metadata: dict = None) -> AuditEvent:
    m_json = json.dumps(metadata) if metadata else None
    audit = AuditEvent(
        event_type=event_type,
        incident_id=incident_id,
        user=user,
        metadata_json=m_json
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit
