import logging

logger = logging.getLogger("metroguard.notification")

def send_maintenance_alert_tool(technician_name: str, task: str, location: str) -> bool:
    # Safe simulated alert notification log
    logger.info(f"[SIMULATED ALERT SENT] To: {technician_name} | Task: '{task}' at {location}.")
    return True
