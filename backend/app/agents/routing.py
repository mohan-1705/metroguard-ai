from app.agents.state import AgentState

def route_after_validation(state: AgentState) -> str:
    if state.get("errors"):
        return "end"
    return "detect_anomaly"

def route_after_anomaly(state: AgentState) -> str:
    if not state.get("anomalies"):
        return "end"
    return "create_incident"

def route_after_policy(state: AgentState) -> str:
    # If policy check has auto-approved (human_approved is True), execute workflow directly
    # Otherwise route to requesting manual approval
    if state.get("human_approved") is True:
        return "execute_approved_workflow"
    return "request_human_approval"
