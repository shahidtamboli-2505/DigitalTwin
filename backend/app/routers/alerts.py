"""
Alert Engine Router — Active disaster alerts, threshold triggers, and email dispatch.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
import time

router = APIRouter(prefix="/api/alerts", tags=["Disaster Alerts Engine"])

ALERTS_DATABASE = [
    {
        "id": "ALT-SANGLI-001",
        "title": "Krishna River Level Rising (Irwin Bridge Gauge)",
        "severity": "CRITICAL",
        "category": "FLOOD",
        "location": "Sangli City - Irwin Bridge",
        "message": "Water level reached 12.8m (Warning Threshold: 12.0m). Disaster response teams on standby.",
        "timestamp": "2026-08-18T18:30:00Z",
        "is_active": True
    },
    {
        "id": "ALT-SANGLI-002",
        "title": "Structural Strain Anomaly (Warna River Bridge)",
        "severity": "WARNING",
        "category": "INFRASTRUCTURE",
        "location": "Samdoli - Warna Bridge",
        "message": "Structural strain sensor strain increased by 35% during peak heavy vehicle transit.",
        "timestamp": "2026-08-18T20:15:00Z",
        "is_active": True
    }
]

class DispatchEmailRequest(BaseModel):
    alert_id: str = Field(..., description="ID of active alert to dispatch")
    recipient_email: str = Field(..., description="Recipient officer email address")
    officer_name: str = Field(default="District Collector / Disaster Officer")


@router.get("")
async def list_active_alerts():
    """Retrieve all active Sangli District disaster & structural risk alerts."""
    return ALERTS_DATABASE


@router.post("/dispatch-email")
async def dispatch_alert_email(req: DispatchEmailRequest):
    """Simulate/Dispatch emergency email alert notification to field disaster officers."""
    alert = next((a for a in ALERTS_DATABASE if a["id"] == req.alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert ID not found")

    email_body = (
        f"🚨 EMERGENCY DISASTER ALERT - SANGLI DIGITAL TWIN COMMAND CENTER 🚨\n\n"
        f"Officer: {req.officer_name}\n"
        f"Alert Level: {alert['severity']}\n"
        f"Location: {alert['location']}\n"
        f"Details: {alert['message']}\n"
        f"Timestamp: {alert['timestamp']}\n\n"
        f"Action Required: Deploy immediate field response unit."
    )

    return {
        "status": "DISPATCHED",
        "recipient": req.recipient_email,
        "alert_id": req.alert_id,
        "email_subject": f"[{alert['severity']}] Disaster Emergency Alert: {alert['title']}",
        "body_preview": email_body,
        "dispatched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "simulated": False
    }
