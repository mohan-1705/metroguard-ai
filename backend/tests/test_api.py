import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.models import Train, SensorReading, Incident, Technician, MaintenanceOrder, Approval, AuditEvent

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    trains = [
        Train(train_id="MTR-109", line="Red", status="NORMAL"),
        Train(train_id="MTR-204", line="Blue", status="NORMAL"),
        Train(train_id="MTR-301", line="Green", status="NORMAL")
    ]
    techs = [
        Technician(id="TECH-001", name="Alice Chen", specialty="Bogie Mechanical Systems", status="Available"),
        Technician(id="TECH-002", name="Bob Miller", specialty="Braking & Pneumatics", status="Available")
    ]
    db.add_all(trains)
    db.add_all(techs)
    db.commit()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_sensor_validation_missing_fields(client):
    payload = {"train_id": "MTR-204", "line": "Blue", "station": "Ameerpet"}
    response = client.post("/api/sensors/events", json=payload)
    assert response.status_code == 422

def test_normal_sensor_event(client):
    payload = {
        "train_id": "MTR-204",
        "line": "Blue",
        "station": "Ameerpet",
        "speed": 62.0,
        "vibration": 3.2,
        "axle_temperature": 74.0,
        "brake_temperature": 91.0,
        "track_temperature": 48.0
    }
    response = client.post("/api/sensors/events", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["incident_created"] is False

def test_anomaly_sensor_event_and_incident_creation(client, db_session):
    payload = {
        "train_id": "MTR-204",
        "line": "Blue",
        "station": "Ameerpet",
        "speed": 62.0,
        "vibration": 8.9,
        "axle_temperature": 104.0,
        "brake_temperature": 126.0,
        "track_temperature": 68.0
    }
    response = client.post("/api/sensors/events", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["incident_created"] is True
    assert res_data["incident_id"] is not None
    
    incident = db_session.query(Incident).filter(Incident.id == res_data["incident_id"]).first()
    assert incident is not None
    assert incident.severity == "CRITICAL"
    assert incident.status == "Awaiting Approval"
    assert incident.ai_confidence > 0.8
    assert incident.recommendation is not None

def test_approval_and_work_order_creation_integration(client, db_session):
    payload = {
        "train_id": "MTR-204",
        "line": "Blue",
        "station": "Ameerpet",
        "speed": 62.0,
        "vibration": 8.9,
        "axle_temperature": 104.0,
        "brake_temperature": 126.0,
        "track_temperature": 68.0
    }
    response = client.post("/api/sensors/events", json=payload)
    incident_id = response.json()["incident_id"]
    
    approve_response = client.post(f"/api/incidents/{incident_id}/approve", json={"comment": "Approved by testing suite"})
    assert approve_response.status_code == 200
    approve_data = approve_response.json()
    assert approve_data["success"] is True
    assert approve_data["work_order_id"] is not None
    assert approve_data["assigned_technician"] is not None
    
    incident = db_session.query(Incident).filter(Incident.id == incident_id).first()
    assert incident.status == "In Progress"

def test_rejection_workflow(client, db_session):
    payload = {
        "train_id": "MTR-204",
        "line": "Blue",
        "station": "Ameerpet",
        "speed": 62.0,
        "vibration": 8.9,
        "axle_temperature": 104.0,
        "brake_temperature": 126.0,
        "track_temperature": 68.0
    }
    response = client.post("/api/sensors/events", json=payload)
    incident_id = response.json()["incident_id"]
    
    reject_response = client.post(f"/api/incidents/{incident_id}/reject", json={"comment": "Rejected by testing suite"})
    assert reject_response.status_code == 200
    
    incident = db_session.query(Incident).filter(Incident.id == incident_id).first()
    assert incident.status == "Rejected"

def test_audit_logs_created(client, db_session):
    payload = {
        "train_id": "MTR-204",
        "line": "Blue",
        "station": "Ameerpet",
        "speed": 62.0,
        "vibration": 8.9,
        "axle_temperature": 104.0,
        "brake_temperature": 126.0,
        "track_temperature": 68.0
    }
    client.post("/api/sensors/events", json=payload)
    
    audit_response = client.get("/api/audit-logs")
    assert audit_response.status_code == 200
    logs = audit_response.json()
    assert len(logs) > 0
    event_types = [l["event_type"] for l in logs]
    assert "SENSOR_RECEIVED" in event_types
    assert "ANOMALY_DETECTED" in event_types
    assert "INCIDENT_CREATED" in event_types
