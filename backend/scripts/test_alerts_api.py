import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing Disaster Alerts Engine & Email Dispatch API (/api/alerts)...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Fetch active alerts
        res_list = await client.get("/api/alerts")
        print(f"Alerts List Status: {res_list.status_code}")
        alerts = res_list.json()
        print(f"Retrieved {len(alerts)} active disaster alerts:")
        for a in alerts:
            print(f" - [{a['id']}] [{a['severity']}] {a['title']}")

        assert res_list.status_code == 200
        assert len(alerts) >= 1

        # 2. Test Emergency Email Dispatch
        target_alert = alerts[0]["id"]
        dispatch_payload = {
            "alert_id": target_alert,
            "recipient_email": "disaster.officer@sangli.gov.in",
            "officer_name": "Collector Sangli District"
        }
        res_dispatch = await client.post("/api/alerts/dispatch-email", json=dispatch_payload)
        print(f"\nEmail Dispatch Status: {res_dispatch.status_code}")
        print("Dispatch Response:", res_dispatch.json())

        assert res_dispatch.status_code == 200
        assert res_dispatch.json()["status"] == "DISPATCHED"
        print("\n[PASSED] Disaster Alerts Engine & Email Dispatch test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
