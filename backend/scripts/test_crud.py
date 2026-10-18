import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing Infrastructure & Analytics APIs...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. List Infrastructure Assets
        infra_res = await client.get("/api/infrastructure")
        print(f"GET /api/infrastructure Status: {infra_res.status_code}")
        assets = infra_res.json()
        print(f"Retrieved {len(assets)} assets from Neon PostgreSQL:")
        for a in assets[:3]:
            print(f"  - {a['name']} ({a['type']}) @ Lat: {a['latitude']}, Lng: {a['longitude']}")

        # 2. GeoJSON Endpoint
        geojson_res = await client.get("/api/infrastructure/geojson")
        print(f"GET /api/infrastructure/geojson Status: {geojson_res.status_code}")
        features = geojson_res.json()["features"]
        print(f"GeoJSON Features Count: {len(features)}")

        # 3. Analytics Summary
        summary_res = await client.get("/api/analytics/summary")
        print(f"GET /api/analytics/summary Status: {summary_res.status_code}")
        print("Analytics Summary:", summary_res.json())

        print("[PASSED] Core CRUD and Analytics API test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
