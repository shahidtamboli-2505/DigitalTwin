import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing Multi-Factor Risk Calculation Engine (/api/analytics/risk-engine)...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {
            "condition": "warning",
            "age_years": 35,
            "flood_probability": 0.85,
            "crack_probability": 0.90,
            "sensor_anomaly_score": 0.60
        }
        res = await client.post("/api/analytics/risk-engine", json=payload)
        print(f"Risk Engine Status: {res.status_code}")
        print("Calculated Risk Result:")
        data = res.json()
        print(f"Final Risk Score: {data['final_risk_score']} ({data['risk_level']})")
        print("Breakdown:", data["breakdown"])

        assert res.status_code == 200
        assert data["final_risk_score"] > 80.0
        assert data["risk_level"] == "CRITICAL"
        print("\n[PASSED] Multi-Factor Risk Calculation Engine test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
