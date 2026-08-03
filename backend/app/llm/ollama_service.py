import requests
import json
import logging
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("metroguard.llm")

def analyze_incident_with_llm(incident_id: str, issue: str, severity: str, telemetry: Dict[str, Any], documents: List[Dict[str, Any]]) -> Dict[str, Any]:
    prompt = f"""
    Analyze the following simulated metro rail incident:
    Incident ID: {incident_id}
    Issue: {issue}
    Severity: {severity}
    Telemetry: {json.dumps(telemetry)}
    Retrieved Maintenance Evidence:
    {json.dumps(documents)}
    
    You must follow these rules strictly:
    - Do not invent facts, sensor values, thresholds, or procedures.
    - Use only retrieved evidence.
    - Return a JSON object with:
      "severity": string (NORMAL, WARNING, HIGH, CRITICAL)
      "summary": string (concise analysis summary)
      "recommendation": string (action plan based on retrieved SOP)
      "evidence": list of strings (citing direct snippets from documents)
      "confidence": float between 0.0 and 1.0
      "requires_human_review": boolean
    """
    
    # Try calling local Ollama
    try:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            result = response.json()
            response_text = result.get("response", "")
            data = json.loads(response_text)
            logger.info("Ollama LLM successfully generated structured response.")
            return data
    except Exception as e:
        logger.warning(f"Ollama request failed or was not reachable: {e}. Running local fallback model.")
        
    # Local fallback logic (Smart Mock LLM)
    # Generates structured JSON based on incident criteria
    is_critical = severity in ["HIGH", "CRITICAL"]
    confidence = 0.91 if is_critical else 0.85
    
    summary = f"Simulated telemetry analysis for incident {incident_id} ({issue}). "
    if "vibration" in issue.lower() or telemetry.get("vibration", 0) > 7:
        summary += f"Critical vibration level of {telemetry.get('vibration', 'N/A')} mm/s detected. This exceeds standard simulated limits."
        rec = "Inspect the simulated bogie/bearing maintenance workflow according to the retrieved maintenance procedure."
        evidence = ["SOP-BOGIE-02: Vibration levels above 7.0 mm/s require immediate trackside bogie inspection."]
    elif "axle" in issue.lower() or telemetry.get("axle_temperature", 0) > 100:
        summary += f"Journal bearing axle temperature of {telemetry.get('axle_temperature', 'N/A')}°C detected. Potential 'Hot-Box' condition."
        rec = "Route the train to the nearest maintenance bay or station pocket track. Apply thermal scanner to verify journal temperature."
        evidence = ["SOP-AXLE-04: Journal bearing temperatures exceeding 100°C require immediate pocket-track routing."]
    elif "brake" in issue.lower() or telemetry.get("brake_temperature", 0) > 120:
        summary += f"Simulated brake caliper temperature of {telemetry.get('brake_temperature', 'N/A')}°C exceeds the 120°C fade limit."
        rec = "Alert simulated driver to monitor braking performance. Dispatch maintenance crew for caliper release check."
        evidence = ["SOP-BRAKE-03: Brake caliper temperatures > 120°C introduce brake fade risk; dispatch crew for release check."]
    else:
        summary += f"Anomalous telemetry value: {issue}."
        rec = "Conduct standard maintenance review on affected train system."
        evidence = ["SOP-RESPONSE-05: Review anomalous values using standard safety protocols."]

    return {
        "severity": severity,
        "summary": summary,
        "recommendation": rec,
        "evidence": evidence,
        "confidence": confidence,
        "requires_human_review": is_critical
    }
