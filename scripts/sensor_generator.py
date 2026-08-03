import argparse
import time
import requests
import random
import datetime

# Telemetry limits
NORMAL_RANGES = {
    "speed": (40.0, 70.0),
    "vibration": (1.5, 3.5),
    "axle_temperature": (60.0, 85.0),
    "brake_temperature": (70.0, 95.0),
    "track_temperature": (35.0, 55.0)
}

TRAINS = [
    {"id": "MTR-109", "line": "Red", "station": "Miyapur"},
    {"id": "MTR-204", "line": "Blue", "station": "Ameerpet"},
    {"id": "MTR-301", "line": "Green", "station": "Nagole"}
]

def generate_normal_payload(train):
    return {
        "train_id": train["id"],
        "line": train["line"],
        "station": train["station"],
        "speed": round(random.uniform(*NORMAL_RANGES["speed"]), 1),
        "vibration": round(random.uniform(*NORMAL_RANGES["vibration"]), 1),
        "axle_temperature": round(random.uniform(*NORMAL_RANGES["axle_temperature"]), 1),
        "brake_temperature": round(random.uniform(*NORMAL_RANGES["brake_temperature"]), 1),
        "track_temperature": round(random.uniform(*NORMAL_RANGES["track_temperature"]), 1)
    }

def generate_anomaly_payload():
    # Demonstration anomaly payload exactly matching requested values
    return {
        "train_id": "MTR-204",
        "line": "Blue",
        "station": "Ameerpet",
        "speed": 62.0,
        "vibration": 8.9,
        "axle_temperature": 104.0,
        "brake_temperature": 126.0,
        "track_temperature": 68.0
    }

def generate_random_payload(train):
    payload = generate_normal_payload(train)
    # Add random anomaly chance (1 in 5 chance of a warning/alert)
    if random.random() < 0.2:
        anomaly_type = random.choice(["vibration", "axle_temperature", "brake_temperature", "track_temperature"])
        if anomaly_type == "vibration":
            payload["vibration"] = round(random.uniform(7.1, 9.5), 1)
        elif anomaly_type == "axle_temperature":
            payload["axle_temperature"] = round(random.uniform(101.0, 115.0), 1)
        elif anomaly_type == "brake_temperature":
            payload["brake_temperature"] = round(random.uniform(121.0, 140.0), 1)
        elif anomaly_type == "track_temperature":
            payload["track_temperature"] = round(random.uniform(66.0, 75.0), 1)
    return payload

def main():
    parser = argparse.ArgumentParser(description="MetroGuard AI Simulated Sensor Generator")
    parser.add_argument("--mode", type=str, choices=["normal", "random", "anomaly"], default="normal", help="Simulation mode")
    parser.add_argument("--interval", type=int, default=5, help="Interval in seconds between events")
    parser.add_argument("--url", type=str, default="http://localhost:8000/api/sensors/events", help="FastAPI target event endpoint")
    parser.add_argument("--count", type=int, default=0, help="Number of payloads to generate before stopping (0 for infinite)")
    
    args = parser.parse_args()
    
    print(f"Starting simulated sensor generator in [{args.mode.upper()}] mode...")
    print(f"Target URL: {args.url}")
    print(f"Interval: {args.interval}s")
    
    sent_count = 0
    try:
        while True:
            if args.mode == "anomaly":
                payload = generate_anomaly_payload()
            elif args.mode == "random":
                train = random.choice(TRAINS)
                payload = generate_random_payload(train)
            else:
                train = random.choice(TRAINS)
                payload = generate_normal_payload(train)
                
            try:
                response = requests.post(args.url, json=payload, timeout=3)
                if response.status_code == 200:
                    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Event sent: Train={payload['train_id']} | Speed={payload['speed']} | Vib={payload['vibration']} | Axle={payload['axle_temperature']} | Brake={payload['brake_temperature']} | Track={payload['track_temperature']} -> Status: {response.json().get('incident_created', 'N/A')}")
                else:
                    print(f"Error {response.status_code}: {response.text}")
            except requests.exceptions.ConnectionError:
                print("Failed to connect to FastAPI backend. Ensure server is running at http://localhost:8000")
            
            sent_count += 1
            if args.count > 0 and sent_count >= args.count:
                print(f"Sent target count of {args.count} events. Stopping.")
                break
                
            # If we sent a demo anomaly, switch to normal/random to avoid spamming the same critical incident
            if args.mode == "anomaly":
                print("Demo anomaly payload sent. Switching mode to 'normal' for subsequent readings...")
                args.mode = "normal"
                
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        print("\nGenerator stopped by user.")

if __name__ == "__main__":
    main()
