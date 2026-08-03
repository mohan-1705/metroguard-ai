from typing import Dict, Any, List

# Simulated demo thresholds
THRESHOLDS = {
    "vibration": 7.0,          # mm/s
    "axle_temperature": 100.0, # °C
    "brake_temperature": 120.0, # °C
    "track_temperature": 65.0   # °C
}

def detect_anomalies(reading: Dict[str, Any]) -> List[Dict[str, Any]]:
    anomalies = []
    
    if reading.get("vibration", 0.0) > THRESHOLDS["vibration"]:
        anomalies.append({
            "type": "HIGH_VIBRATION",
            "value": reading["vibration"],
            "threshold": THRESHOLDS["vibration"],
            "severity": "CRITICAL" if reading["vibration"] > 8.5 else "HIGH",
            "sensor": "vibration"
        })
        
    if reading.get("axle_temperature", 0.0) > THRESHOLDS["axle_temperature"]:
        anomalies.append({
            "type": "HIGH_AXLE_TEMP",
            "value": reading["axle_temperature"],
            "threshold": THRESHOLDS["axle_temperature"],
            "severity": "CRITICAL" if reading["axle_temperature"] > 103.0 else "HIGH",
            "sensor": "axle_temperature"
        })
        
    if reading.get("brake_temperature", 0.0) > THRESHOLDS["brake_temperature"]:
        anomalies.append({
            "type": "HIGH_BRAKE_TEMP",
            "value": reading["brake_temperature"],
            "threshold": THRESHOLDS["brake_temperature"],
            "severity": "CRITICAL" if reading["brake_temperature"] > 125.0 else "HIGH",
            "sensor": "brake_temperature"
        })
        
    if reading.get("track_temperature", 0.0) > THRESHOLDS["track_temperature"]:
        anomalies.append({
            "type": "HIGH_TRACK_TEMP",
            "value": reading["track_temperature"],
            "threshold": THRESHOLDS["track_temperature"],
            "severity": "HIGH",
            "sensor": "track_temperature"
        })
        
    return anomalies
