from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    sensor_event: Dict[str, Any]
    anomalies: List[Dict[str, Any]]
    retrieved_documents: List[Dict[str, Any]]
    incident: Optional[Dict[str, Any]]
    analysis: Optional[Dict[str, Any]]
    severity: Optional[str]
    confidence: Optional[float]
    recommendation: Optional[str]
    human_approved: Optional[bool]
    work_order_id: Optional[str]
    audit_events: List[Dict[str, Any]]
    errors: List[str]
