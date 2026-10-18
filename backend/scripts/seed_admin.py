import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from sqlalchemy import select
from app.core.database import async_session
from app.core.security import hash_password
from app.models.user import User
from app.models.role import Role, UserRole

ROLES = [
    {"name": "Admin", "description": "Full administrator access across all assets and settings"},
    {"name": "Field Officer", "description": "Field inspector role for submitting sensor reports and crack scans"},
    {"name": "Viewer", "description": "Read-only access for monitoring map twin and alerts"}
]

async def seed_auth_data():
    print("Seeding Auth Roles and default Admin User...")
    async with async_session() as session:
        # Create roles
        role_map = {}
        for rdata in ROLES:
            res = await session.execute(select(Role).where(Role.name == rdata["name"]))
            role = res.scalar_one_or_none()
            if not role:
                role = Role(name=rdata["name"], description=rdata["description"])
                session.add(role)
                await session.flush()
                print(f"Created role: {rdata['name']}")
            role_map[rdata["name"]] = role

        # Seed Admin user
        admin_email = "admin@sanglidigitaltwin.gov.in"
        user_res = await session.execute(select(User).where(User.email == admin_email))
        admin = user_res.scalar_one_or_none()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=hash_password("Admin@Sangli2026"),
                full_name="Sangli District Collectorate Admin",
                phone="+91 233 2600100",
                is_active=True,
                is_verified=True,
            )
            session.add(admin)
            await session.flush()
            
            user_role = UserRole(user_id=admin.id, role_id=role_map["Admin"].id)
            session.add(user_role)
            print(f"✅ Created default Admin user: {admin_email} / Admin@Sangli2026")

        await session.commit()
        print("🎉 Auth roles & Admin user seed completed!")

if __name__ == "__main__":
    asyncio.run(seed_auth_data())
