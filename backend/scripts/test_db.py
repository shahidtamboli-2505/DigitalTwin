import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from sqlalchemy import text
from app.core.database import engine

import traceback

async def main():
    print("Testing database engine connection...")
    try:
        async with engine.connect() as conn:
            print("[PASSED] SQLAlchemy Engine connected successfully to Neon PostgreSQL!")
            res = await conn.execute(text("SELECT version();"))
            print(f"PostgreSQL Version: {res.scalar()}")
            
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                print("[PASSED] PostGIS extension checked/enabled!")
            except Exception as e:
                print(f"PostGIS notice: {e}")
    except Exception as exc:
        print("[FAILED] Error connecting:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
