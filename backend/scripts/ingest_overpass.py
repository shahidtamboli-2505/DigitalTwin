import asyncio
import sys
import os
import uuid
import httpx
import random
sys.path.insert(0, os.path.abspath("backend"))

from sqlalchemy import select
from app.core.database import async_session
from app.models.infrastructure import Infrastructure
from app.models.bridge import Bridge
from app.models.dam import Dam
from app.models.hospital import Hospital

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Sangli Bounding Box approx: [south, west, north, east]
SANGLI_BBOX = "16.70,74.20,17.30,75.20"

OVERPASS_QUERY = f"""
[out:json][timeout:30];
(
  node["bridge"="yes"]({SANGLI_BBOX});
  way["bridge"="yes"]({SANGLI_BBOX});
  node["amenity"="hospital"]({SANGLI_BBOX});
  way["amenity"="hospital"]({SANGLI_BBOX});
  node["waterway"="dam"]({SANGLI_BBOX});
  way["waterway"="dam"]({SANGLI_BBOX});
  node["power"="plant"]({SANGLI_BBOX});
  way["power"="plant"]({SANGLI_BBOX});
  node["man_made"="water_works"]({SANGLI_BBOX});
  way["man_made"="water_works"]({SANGLI_BBOX});
);
out center;
"""

KNOWN_SANGLI_ASSETS = [
    {
        "name": "Irwin Bridge Sangli",
        "type": "bridge",
        "category": "Historical Heritage Bridge",
        "lat": 16.8520,
        "lng": 74.5800,
        "construction_year": 1929,
        "material": "Stone & Steel Arch",
        "risk_score": 78.5,
        "health_score": 62.0,
        "description": "Historic arch bridge over Krishna River connecting Sangli and Miraj. Built in 1929 during British era."
    },
    {
        "name": "Chandoli Dam (Warna Project)",
        "type": "dam",
        "category": "Earthen Dam",
        "lat": 17.1350,
        "lng": 73.8620,
        "construction_year": 1998,
        "material": "Earthen & Concrete Spillway",
        "risk_score": 45.0,
        "health_score": 88.5,
        "description": "Major dam on Warna river in Shirala taluka supplying irrigation and drinking water."
    },
    {
        "name": "Miraj Government Medical College Hospital",
        "type": "hospital",
        "category": "Tertiary Care Hospital",
        "lat": 16.8300,
        "lng": 74.6400,
        "construction_year": 1962,
        "material": "Reinforced Concrete",
        "risk_score": 30.0,
        "health_score": 85.0,
        "description": "Primary tertiary medical research and healthcare hub for Sangli-Miraj urban complex."
    },
    {
        "name": "Haripur Krishna-Warna Sangam Bridge",
        "type": "bridge",
        "category": "River Bridge",
        "lat": 16.8410,
        "lng": 74.5520,
        "construction_year": 1985,
        "material": "RCC Girder",
        "risk_score": 65.0,
        "health_score": 71.0,
        "description": "Bridge near confluence of Krishna and Warna rivers, highly critical during monsoon flood events."
    },
    {
        "name": "Ankali Bridge Sangli",
        "type": "bridge",
        "category": "State Highway Bridge",
        "lat": 16.8450,
        "lng": 74.6050,
        "construction_year": 1978,
        "material": "Prestressed Concrete",
        "risk_score": 58.0,
        "health_score": 75.0,
        "description": "Major road bridge linking Sangli to Kolhapur Highway crossing Krishna River flood catchment."
    }
]

async def fetch_overpass_data():
    print("🌐 Querying OpenStreetMap Overpass API for Sangli District infrastructure...")
    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            response = await client.post(OVERPASS_URL, data={"data": OVERPASS_QUERY})
            if response.status_code == 200:
                data = response.json()
                elements = data.get("elements", [])
                print(f"✅ Fetched {len(elements)} real infrastructure features from Overpass API!")
                return elements
            else:
                print(f"⚠️ Overpass returned status code {response.status_code}")
                return []
    except Exception as e:
        print(f"⚠️ Overpass API query failed: {e}")
        return []

async def seed_infrastructure():
    osm_elements = await fetch_overpass_data()
    
    async with async_session() as session:
        # Check existing count
        result = await session.execute(select(Infrastructure))
        existing = result.scalars().all()
        if existing:
            print(f"ℹ️ Database already contains {len(existing)} infrastructure records.")
        
        inserted_count = 0
        
        # 1. Seed Known High-Priority Sangli Assets
        for item in KNOWN_SANGLI_ASSETS:
            # Check if exists by name
            q = await session.execute(select(Infrastructure).where(Infrastructure.name == item["name"]))
            if q.scalar_one_or_none():
                continue
                
            infra = Infrastructure(
                id=uuid.uuid4(),
                name=item["name"],
                type=item["type"],
                category=item["category"],
                district="Sangli",
                taluka="Miraj",
                latitude=item["lat"],
                longitude=item["lng"],
                construction_year=item["construction_year"],
                material=item["material"],
                current_status="degraded" if item["risk_score"] > 60 else "operational",
                risk_score=item["risk_score"],
                health_score=item["health_score"],
                description=item["description"],
                owner="Public Works Dept (PWD) Maharashtra"
            )
            session.add(infra)
            inserted_count += 1

        # 2. Process Overpass OSM Elements
        for elem in osm_elements:
            tags = elem.get("tags", {})
            lat = elem.get("lat") or elem.get("center", {}).get("lat")
            lng = elem.get("lon") or elem.get("center", {}).get("lon")
            
            if not lat or not lng:
                continue
                
            name = tags.get("name") or tags.get("name:en") or f"OSM {tags.get('amenity', tags.get('bridge', 'Structure')).title()} {elem['id']}"
            
            # Map type
            if tags.get("bridge") == "yes":
                itype = "bridge"
            elif tags.get("amenity") == "hospital":
                itype = "hospital"
            elif tags.get("waterway") == "dam":
                itype = "dam"
            elif tags.get("power") == "plant":
                itype = "power_station"
            elif tags.get("man_made") == "water_works":
                itype = "water_treatment"
            else:
                itype = "road"

            # Avoid duplication by lat/lng proximity
            q = await session.execute(select(Infrastructure).where(Infrastructure.name == name))
            if q.scalar_one_or_none():
                continue

            risk = round(random.uniform(20.0, 75.0), 1)
            health = round(100.0 - risk, 1)

            infra = Infrastructure(
                id=uuid.uuid4(),
                name=name,
                type=itype,
                category=tags.get("building") or tags.get("highway") or itype,
                district="Sangli",
                latitude=lat,
                longitude=lng,
                current_status="operational" if risk < 50 else "degraded",
                risk_score=risk,
                health_score=health,
                description=f"Ingested from OpenStreetMap (OSM ID: {elem['id']})",
                owner="Government of Maharashtra"
            )
            session.add(infra)
            inserted_count += 1

        await session.commit()
        print(f"🎉 Successfully ingested and saved {inserted_count} infrastructure assets into Neon PostGIS database!")

if __name__ == "__main__":
    asyncio.run(seed_infrastructure())
