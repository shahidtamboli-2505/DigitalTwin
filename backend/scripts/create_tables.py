import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from app.core.database import engine, Base
import app.models  # Import all models to register with Base.metadata

async def main():
    print("Creating all tables in Neon PostgreSQL...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully!")

if __name__ == "__main__":
    asyncio.run(main())
