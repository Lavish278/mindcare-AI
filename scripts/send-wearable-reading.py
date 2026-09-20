#!/usr/bin/env python3
"""
MindCare AI — External Wearable Device Telemetry Ingestion Client
Enables real physical wearables, smartwatch companion bridges (Apple HealthKit / WearOS / Garmin),
or IoT biosensor hardware (ESP32, Arduino PPG) to stream biometric readings directly into MindCare AI.

Usage Examples:
  # Send a single resting heart rate reading:
  python scripts/send-wearable-reading.py --hr 72 --mode AWAKE --steps 120

  # Send an exercise reading:
  python scripts/send-wearable-reading.py --hr 145 --mode EXERCISE --steps 4500

  # Send an unusual elevated HR during sleep:
  python scripts/send-wearable-reading.py --hr 108 --mode SLEEP

  # Send a noisy/suspicious reading (tests Data Quality Gate):
  python scripts/send-wearable-reading.py --hr 230

  # Stream continuous live readings every 3 seconds:
  python scripts/send-wearable-reading.py --stream --interval 3
"""

import sys
import time
import argparse
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def send_reading(base_url: str, token: str, payload: dict) -> dict:
    url = f"{base_url.rstrip('/')}/api/v1/wearables/ingest"
    headers = {
        "Content-Type": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.getcode()
            response_body = resp.read().decode("utf-8")
            return json.loads(response_body)
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8")
        print(f"❌ Server Error {e.code}: {error_msg}")
        return {"error": error_msg, "status_code": e.code}
    except urllib.error.URLError as e:
        print(f"❌ Connection Error: {e.reason}")
        print(f"   Ensure MindCare backend server is running on {base_url}")
        return {"error": str(e.reason)}


def main():
    parser = argparse.ArgumentParser(description="MindCare AI Live Wearable Telemetry Sender")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="MindCare Backend Base URL")
    parser.add_argument("--token", default="", help="JWT Bearer Token (optional for demo-user)")
    parser.add_argument("--hr", type=int, default=74, help="Heart Rate in BPM (e.g. 72)")
    parser.add_argument("--mode", default=None, choices=["AWAKE", "SLEEP", "EXERCISE"], help="Context mode")
    parser.add_argument("--steps", type=int, default=0, help="Step count")
    parser.add_argument("--battery", type=int, default=92, help="Device battery level percentage")
    parser.add_argument("--device", default="Physical Wearable Device", help="Device name/identifier")
    parser.add_argument("--stream", action="store_true", help="Continuously send readings in a live loop")
    parser.add_argument("--interval", type=int, default=3, help="Streaming interval in seconds")

    args = parser.parse_args()

    print("=" * 65)
    print("⌚ MindCare AI — External Wearable Hardware Ingestion Bridge")
    print("=" * 65)
    print(f"Target Server : {args.url}")
    print(f"Device Name   : {args.device}")

    if not args.stream:
        payload = {
            "heart_rate": args.hr,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "context_mode": args.mode,
            "steps": args.steps,
            "battery_level": args.battery,
            "device_name": args.device,
            "device_id": "HARDWARE-BRIDGE-01",
            "source": "Physical Hardware Bridge"
        }
        print(f"\n📡 Transmitting single reading: HR={args.hr} BPM, Mode={args.mode or 'Auto'}, Steps={args.steps}...")
        result = send_reading(args.url, args.token, payload)
        
        if "reading" in result:
            r = result["reading"]
            eval_res = result.get("anomaly_evaluation", {})
            print("\n✅ Reading Successfully Processed & Analyzed by MindCare AI:")
            print(f"   • Heart Rate   : {r.get('heart_rate')} BPM")
            print(f"   • Data Quality : {r.get('data_quality')} ({r.get('quality_rationale')})")
            print(f"   • Context Mode : {r.get('context_mode')}")
            print(f"   • Anomaly State: {eval_res.get('state', 'NORMAL')} (Anomaly: {eval_res.get('is_anomaly', False)})")
            print(f"   • Explanation  : {eval_res.get('explanation', 'N/A')}")
            if eval_res.get('recommendation'):
                print(f"   • Suggestion   : {eval_res.get('recommendation')}")
        else:
            print("Response:", result)
    else:
        print(f"\n🔄 Streaming live biometric telemetry every {args.interval}s (Ctrl+C to stop)...")
        import random
        base_hr = args.hr
        try:
            while True:
                # Add natural physiological heart-rate jitter
                jitter = random.randint(-2, 3)
                current_hr = max(45, min(200, base_hr + jitter))
                payload = {
                    "heart_rate": current_hr,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "context_mode": args.mode,
                    "steps": args.steps + random.randint(0, 10),
                    "battery_level": args.battery,
                    "device_name": args.device,
                    "device_id": "HARDWARE-BRIDGE-01",
                    "source": "Physical Hardware Stream"
                }
                res = send_reading(args.url, args.token, payload)
                if "reading" in res:
                    q = res["reading"].get("data_quality")
                    m = res["reading"].get("context_mode")
                    a = res.get("anomaly_evaluation", {}).get("status")
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Transmitted: {current_hr:3d} BPM | Quality: {q:<10} | Mode: {m:<8} | Anomaly: {a}")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n🛑 Telemetry stream stopped by user.")


if __name__ == "__main__":
    main()
