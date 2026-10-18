import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing IoT Sensors REST endpoint (/api/sensors)...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/sensors")
        print(f"Sensors REST Endpoint Status: {res.status_code}")
        sensors = res.json()
        print(f"Retrieved {len(sensors)} active sensors:")
        for s in sensors:
            print(f" - [{s['id']}] {s['name']}: {s['value']} {s['unit']}")

        assert res.status_code == 200
        assert len(sensors) >= 4
        print("\n[PASSED] IoT Sensors REST API test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
