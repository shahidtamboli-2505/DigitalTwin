import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing Auth Endpoints via httpx ASGITransport...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Login
        login_res = await client.post("/api/auth/login", json={
            "email": "admin@sanglidigitaltwin.gov.in",
            "password": "Admin@Sangli2026"
        })
        print(f"Login Status: {login_res.status_code}")
        token_data = login_res.json()
        print(f"Access Token generated: {token_data.get('access_token')[:25]}...")
        
        # 2. Get Profile (/api/auth/me)
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        me_res = await client.get("/api/auth/me", headers=headers)
        print(f"Profile Status: {me_res.status_code}")
        user_info = me_res.json()
        print(f"User Profile: {user_info['full_name']} | Roles: {user_info['roles']}")
        print("[PASSED] Auth endpoints test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
