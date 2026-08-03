import datetime
import uuid
import json
from typing import Dict, Any
from app.agents.state import AgentState
from app.db.database import SessionLocal
from app.models.incident import Incident
from app.models.train import Train
from app.services.anomaly_detection import detect_anomalies
from app.rag.retriever import retrieve_evidence
from app.llm.ollama_service import analyze_incident_with_llm
from app.tools.work_order import create_work_order_tool
from app.tools.technician import get_available_technicians_tool, assign_technician_tool
from app.tools.notification import send_maintenance_alert_tool
from app.tools.audit_event import write_audit_event_tool
from app.tools.incident import update_incident_status_tool

def validate_data_node(state: AgentState) -> Dict[str, Any]:
    event = state.get("sensor_event", {})
    errors = []
    required = ["train_id", "line", "station", "speed", "vibration", "axle_temperature", "brake_temperature", "track_temperature"]
    for r in required:
        if r not in event:
            errors.append(f"Missing required sensor field: {r}")
            
    audit_evt = {
        "event_type": "SENSOR_RECEIVED",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"errors": errors, "train_id": event.get("train_id")}
    }
    
    # Save to db
    db = SessionLocal()
    try:
        # Check train status or register
        train_id = event.get("train_id")
        if train_id:
            train = db.query(Train).filter(Train.train_id == train_id).first()
            if not train:
                train = Train(train_id=train_id, line=event.get("line", "Unknown"), status="NORMAL")
                db.add(train)
                db.commit()
    finally:
        db.close()
        
    return {
        "errors": errors,
        "audit_events": state.get("audit_events", []) + [audit_evt]
    }

def detect_anomaly_node(state: AgentState) -> Dict[str, Any]:
    if state.get("errors"):
        return {}
    event = state["sensor_event"]
    anomalies = detect_anomalies(event)
    
    audit_evt = {
        "event_type": "ANOMALY_DETECTED" if anomalies else "NO_ANOMALY",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"anomalies_count": len(anomalies), "anomalies": anomalies}
    }
    
    return {
        "anomalies": anomalies,
        "audit_events": state.get("audit_events", []) + [audit_evt]
    }

def create_incident_node(state: AgentState) -> Dict[str, Any]:
    if state.get("errors") or not state.get("anomalies"):
        return {}
        
    event = state["sensor_event"]
    anomalies = state["anomalies"]
    primary_anomaly = anomalies[0]
    
    db = SessionLocal()
    try:
        incident_id = f"INC-{uuid.uuid4().hex[:4].upper()}"
        issue_desc = f"{primary_anomaly['type']} on train {event['train_id']}"
        severity = primary_anomaly["severity"]
        
        incident = Incident(
            id=incident_id,
            train_id=event["train_id"],
            line=event["line"],
            station=event["station"],
            detected_issue=issue_desc,
            severity=severity,
            status="Awaiting Approval" if severity in ["HIGH", "CRITICAL"] else "Approved"
        )
        db.add(incident)
        
        # Log audit db
        write_audit_event_tool(db, "INCIDENT_CREATED", incident_id=incident_id, metadata={"issue": issue_desc, "severity": severity})
        
        # Update train status
        train = db.query(Train).filter(Train.train_id == event["train_id"]).first()
        if train:
            train.status = severity
            
        db.commit()
        
        incident_dict = {
            "id": incident.id,
            "train_id": incident.train_id,
            "line": incident.line,
            "station": incident.station,
            "detected_issue": incident.detected_issue,
            "severity": incident.severity,
            "status": incident.status
        }
    finally:
        db.close()
        
    audit_evt = {
        "event_type": "INCIDENT_CREATED",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"incident_id": incident_id}
    }
    
    return {
        "incident": incident_dict,
        "audit_events": state.get("audit_events", []) + [audit_evt]
    }

def retrieve_knowledge_node(state: AgentState) -> Dict[str, Any]:
    if state.get("errors") or not state.get("incident"):
        return {}
        
    incident = state["incident"]
    query = f"{incident['detected_issue']} {incident['station']}"
    documents = retrieve_evidence(query)
    
    audit_evt = {
        "event_type": "RAG_SEARCH",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"query": query, "retrieved_count": len(documents)}
    }
    
    # Log detailed document retrievals
    extra_audits = []
    for doc in documents:
        extra_audits.append({
            "event_type": "DOCUMENT_RETRIEVED",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "metadata": {"document_name": doc["metadata"]["document_name"], "section": doc["metadata"]["section"]}
        })
        
    return {
        "retrieved_documents": documents,
        "audit_events": state.get("audit_events", []) + [audit_evt] + extra_audits
    }

def analyze_incident_node(state: AgentState) -> Dict[str, Any]:
    if state.get("errors") or not state.get("incident"):
        return {}
        
    incident = state["incident"]
    telemetry = state["sensor_event"]
    docs = state["retrieved_documents"]
    
    analysis_res = analyze_incident_with_llm(
        incident_id=incident["id"],
        issue=incident["detected_issue"],
        severity=incident["severity"],
        telemetry=telemetry,
        documents=docs
    )
    
    db = SessionLocal()
    try:
        inc = db.query(Incident).filter(Incident.id == incident["id"]).first()
        if inc:
            inc.ai_confidence = analysis_res.get("confidence")
            inc.ai_summary = analysis_res.get("summary")
            inc.recommendation = analysis_res.get("recommendation")
            db.commit()
    finally:
        db.close()
        
    audit_evt = {
        "event_type": "AI_ANALYSIS",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"confidence": analysis_res.get("confidence"), "severity": analysis_res.get("severity")}
    }
    
    return {
        "analysis": analysis_res,
        "severity": analysis_res.get("severity"),
        "confidence": analysis_res.get("confidence"),
        "recommendation": analysis_res.get("recommendation"),
        "audit_events": state.get("audit_events", []) + [audit_evt]
    }

def policy_check_node(state: AgentState) -> Dict[str, Any]:
    if state.get("errors") or not state.get("incident"):
        return {}
        
    incident = state["incident"]
    severity = state.get("severity", "NORMAL")
    confidence = state.get("confidence", 0.0)
    
    # Rule: severity HIGH/CRITICAL or confidence < 0.7 requires human review
    requires_review = (severity in ["HIGH", "CRITICAL"]) or (confidence < 0.70)
    
    audit_evt = {
        "event_type": "POLICY_CHECK",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"requires_human_review": requires_review, "severity": severity, "confidence": confidence}
    }
    
    return {
        "human_approved": False if requires_review else True, # True means auto-approved workflow
        "audit_events": state.get("audit_events", []) + [audit_evt]
    }

def request_human_approval_node(state: AgentState) -> Dict[str, Any]:
    if state.get("errors") or not state.get("incident"):
        return {}
        
    incident = state["incident"]
    audit_evt = {
        "event_type": "APPROVAL_REQUESTED",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"incident_id": incident["id"]}
    }
    
    db = SessionLocal()
    try:
        write_audit_event_tool(db, "APPROVAL_REQUESTED", incident_id=incident["id"])
    finally:
        db.close()
        
    return {
        "audit_events": state.get("audit_events", []) + [audit_evt]
    }

def execute_approved_workflow_node(state: AgentState) -> Dict[str, Any]:
    if state.get("errors") or not state.get("incident"):
        return {}
        
    incident = state["incident"]
    db = SessionLocal()
    wo_id = None
    
    try:
        # 1. Create simulated Work Order
        task = state.get("recommendation") or f"Inspect incident {incident['id']} anomalies."
        wo = create_work_order_tool(db, incident_id=incident["id"], task=task, priority=incident["severity"])
        wo_id = wo.id
        
        # 2. Assign Technician
        techs = get_available_technicians_tool(db)
        assigned_tech_name = "Unassigned"
        if techs:
            tech = techs[0]
            assign_technician_tool(db, wo.id, tech.id)
            assigned_tech_name = tech.name
            
            # Send Notification Alert
            send_maintenance_alert_tool(tech.name, task, incident["station"])
            
        # 3. Update Incident Status
        update_incident_status_tool(db, incident["id"], "In Progress")
        
        # 4. Log Audits
        write_audit_event_tool(db, "WORK_ORDER_CREATED", incident_id=incident["id"], metadata={"work_order_id": wo_id})
        if techs:
            write_audit_event_tool(db, "TECHNICIAN_ASSIGNED", incident_id=incident["id"], metadata={"technician_id": tech.id, "technician_name": tech.name})
            
    finally:
        db.close()
        
    audit_evt = {
        "event_type": "WORK_ORDER_CREATED",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "metadata": {"work_order_id": wo_id}
    }
    
    return {
        "work_order_id": wo_id,
        "audit_events": state.get("audit_events", []) + [audit_evt]
    }

def audit_node(state: AgentState) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        incident_id = state.get("incident", {}).get("id") if state.get("incident") else None
        for evt in state.get("audit_events", []):
            write_audit_event_tool(
                db=db,
                event_type=evt["event_type"],
                incident_id=incident_id,
                user="SYSTEM",
                metadata=evt.get("metadata")
            )
    except Exception as e:
        print(f"Error logging batch audits: {e}")
    finally:
        db.close()
    return {}
