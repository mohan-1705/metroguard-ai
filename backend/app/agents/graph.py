from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.nodes import (
    validate_data_node,
    detect_anomaly_node,
    create_incident_node,
    retrieve_knowledge_node,
    analyze_incident_node,
    policy_check_node,
    request_human_approval_node,
    execute_approved_workflow_node,
    audit_node
)
from app.agents.routing import (
    route_after_validation,
    route_after_anomaly,
    route_after_policy
)

workflow = StateGraph(AgentState)

# Define nodes
workflow.add_node("validate_data", validate_data_node)
workflow.add_node("detect_anomaly", detect_anomaly_node)
workflow.add_node("create_incident", create_incident_node)
workflow.add_node("retrieve_knowledge", retrieve_knowledge_node)
workflow.add_node("analyze_incident", analyze_incident_node)
workflow.add_node("policy_check", policy_check_node)
workflow.add_node("request_human_approval", request_human_approval_node)
workflow.add_node("execute_approved_workflow", execute_approved_workflow_node)
workflow.add_node("audit", audit_node)

# Set entry point
workflow.set_entry_point("validate_data")

# Connect nodes
workflow.add_conditional_edges(
    "validate_data",
    route_after_validation,
    {
        "end": "audit",
        "detect_anomaly": "detect_anomaly"
    }
)

workflow.add_conditional_edges(
    "detect_anomaly",
    route_after_anomaly,
    {
        "end": "audit",
        "create_incident": "create_incident"
    }
)

workflow.add_edge("create_incident", "retrieve_knowledge")
workflow.add_edge("retrieve_knowledge", "analyze_incident")
workflow.add_edge("analyze_incident", "policy_check")

workflow.add_conditional_edges(
    "policy_check",
    route_after_policy,
    {
        "execute_approved_workflow": "execute_approved_workflow",
        "request_human_approval": "request_human_approval"
    }
)

workflow.add_edge("request_human_approval", "audit")
workflow.add_edge("execute_approved_workflow", "audit")
workflow.add_edge("audit", END)

# Compile graph
agent_graph = workflow.compile()
