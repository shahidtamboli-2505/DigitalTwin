"""
IoT Sensors Router — REST endpoints & WebSocket live telemetry stream.
"""

import asyncio
import random
import time
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/api/sensors", tags=["IoT Sensors"])

SENSORS_STATE = [
    {
        "id": "SNS-KRISHNA-01",
        "name": "Krishna River Level Gauge - Irwin Bridge",
        "type": "water_level",
        "location": [16.8524, 74.5815],
        "unit": "meters",
        "danger_threshold": 16.5,
        "warning_threshold": 12.0,
        "value": 8.4
    },
    {
        "id": "SNS-WARNA-01",
        "name": "Warna River Gauge - Samdoli",
        "type": "water_level",
        "location": [16.9200, 74.5100],
        "unit": "meters",
        "danger_threshold": 14.0,
        "warning_threshold": 10.0,
        "value": 6.8
    },
    {
        "id": "SNS-IRWIN-STRAIN-01",
        "name": "Irwin Bridge Structural Strain Sensor",
        "type": "strain",
        "location": [16.8530, 74.5820],
        "unit": "microstrain",
        "danger_threshold": 450,
        "warning_threshold": 300,
        "value": 185
    },
    {
        "id": "SNS-SHERADA-TILT-01",
        "name": "Sherada Dam Embankment Tilt Sensor",
        "type": "tilt",
        "location": [17.0200, 74.3500],
        "unit": "degrees",
        "danger_threshold": 2.5,
        "warning_threshold": 1.2,
        "value": 0.3
    }
]

@router.get("")
async def get_sensors_list():
    """Get current snapshot of all active IoT sensors in Sangli District."""
    return SENSORS_STATE


# ── WebSocket Manager ───────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_sensor_stream(websocket: WebSocket):
    """WebSocket endpoint pushing real-time IoT sensor telemetry every 2 seconds."""
    await manager.connect(websocket)
    try:
        while True:
            # Generate subtle realistic fluctuations
            updated_sensors = []
            for s in SENSORS_STATE:
                noise = random.uniform(-0.1, 0.1)
                new_val = round(max(0.0, s["value"] + noise), 2)
                s["value"] = new_val

                status = (
                    "CRITICAL" if new_val >= s["danger_threshold"]
                    else "WARNING" if new_val >= s["warning_threshold"]
                    else "NORMAL"
                )

                updated_sensors.append({
                    "id": s["id"],
                    "name": s["name"],
                    "type": s["type"],
                    "value": new_val,
                    "unit": s["unit"],
                    "status": status,
                    "timestamp": time.time()
                })

            await websocket.send_json({
                "type": "sensor_telemetry_batch",
                "timestamp": time.time(),
                "sensors": updated_sensors
            })
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
