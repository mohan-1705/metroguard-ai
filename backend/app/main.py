import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.database import engine, Base, SessionLocal
from app.models.train import Train
from app.models.work_order import Technician
from app.rag.ingest import ingest_knowledge
from app.api.ws import manager

# Import Routers
from app.api.dashboard import router as dashboard_router
from app.api.sensors import router as sensors_router
from app.api.incidents import router as incidents_router
from app.api.approvals import router as approvals_router
from app.api.work_orders import router as work_orders_router
from app.api.knowledge import router as knowledge_router
from app.api.audit import router as audit_router
from app.api.analytics import router as analytics_router

setup_logging()

app = FastAPI(
    title="MetroGuard AI API",
    description="Agentic Metro Maintenance & Incident Workflow Automation Platform API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api
app.include_router(dashboard_router, prefix="/api")
app.include_router(sensors_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")
app.include_router(work_orders_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "MetroGuard AI API"}

# Real-time WebSocket connection
@app.websocket("/ws/sensors")
async def websocket_sensors(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection, receive client packets (if any)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# DB and RAG Initialization on Startup
@app.on_event("startup")
def startup_event():
    # 1. Initialize SQLite / PostgreSQL tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed trains if empty
        if db.query(Train).count() == 0:
            trains = [
                Train(train_id="MTR-109", line="Red", status="NORMAL"),
                Train(train_id="MTR-204", line="Blue", status="NORMAL"),
                Train(train_id="MTR-301", line="Green", status="NORMAL")
            ]
            db.add_all(trains)
            db.commit()
            
        # Seed technicians if empty
        if db.query(Technician).count() == 0:
            techs = [
                Technician(id="TECH-001", name="Alice Chen", specialty="Bogie Mechanical Systems", status="Available"),
                Technician(id="TECH-002", name="Bob Miller", specialty="Braking & Pneumatics", status="Available"),
                Technician(id="TECH-003", name="Charlie Patel", specialty="Journal Bearings & Axles", status="Available"),
                Technician(id="TECH-004", name="Diana Ross", specialty="Track & Thermal Systems", status="Available")
            ]
            db.add_all(techs)
            db.commit()
    finally:
        db.close()
        
    # 2. Ingest RAG documents automatically if index doesn't exist
    index_file = settings.FAISS_INDEX_PATH + ".json"
    if not os.path.exists(index_file):
        print("Knowledge index not found. Initiating automatic ingestion...")
        ingest_knowledge()
