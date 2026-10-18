import asyncio
import asyncpg
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from app.core.config import get_settings

settings = get_settings()

async def main():
    print("Enabling PostGIS extension on Neon PostgreSQL...")
    url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://").replace("?sslmode=require", "").replace("&sslmode=require", "")
    conn = await asyncpg.connect(url, ssl=True)
    try:
        res = await conn.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        print("✅ PostGIS extension created/enabled:", res)
    except Exception as e:
        print("❌ Could not enable PostGIS extension:", e)
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
