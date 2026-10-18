import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing XGBoost Flood Risk Prediction API (/api/ai/flood)...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # High Rainfall Scenario
        req_high = {
            "temp_max": 28.5,
            "temp_min": 21.0,
            "precipitation": 85.0,
            "rain_3d_sum": 160.0,
            "rain_7d_sum": 240.0,
            "wind_speed": 18.0
        }
        res_high = await client.post("/api/ai/flood", json=req_high)
        print(f"High Rainfall Scenario Status: {res_high.status_code}")
        print("Prediction Result:", res_high.json())

        # Low Rainfall Scenario
        req_low = {
            "temp_max": 34.0,
            "temp_min": 20.0,
            "precipitation": 2.0,
            "rain_3d_sum": 5.0,
            "rain_7d_sum": 12.0,
            "wind_speed": 8.0
        }
        res_low = await client.post("/api/ai/flood", json=req_low)
        print(f"\nLow Rainfall Scenario Status: {res_low.status_code}")
        print("Prediction Result:", res_low.json())

        assert res_high.status_code == 200
        assert res_low.status_code == 200
        print("\n[PASSED] XGBoost Flood Risk API test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
