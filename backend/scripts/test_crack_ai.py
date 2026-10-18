import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing Structural Crack Detection API (/api/ai/crack-detection)...")
    transport = httpx.ASGITransport(app=app)

    crack_img_path = os.path.join("ai", "datasets", "cracks", "crack_1.jpg")
    healthy_img_path = os.path.join("ai", "datasets", "cracks", "non_crack_1.jpg")

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Test Cracked Image
        with open(crack_img_path, "rb") as f:
            res_crack = await client.post(
                "/api/ai/crack-detection",
                files={"file": ("crack_1.jpg", f, "image/jpeg")}
            )
        print(f"Cracked Image Test Status: {res_crack.status_code}")
        print("Result:", res_crack.json())

        # Test Healthy Concrete Image
        with open(healthy_img_path, "rb") as f:
            res_healthy = await client.post(
                "/api/ai/crack-detection",
                files={"file": ("non_crack_1.jpg", f, "image/jpeg")}
            )
        print(f"\nHealthy Image Test Status: {res_healthy.status_code}")
        print("Result:", res_healthy.json())

        assert res_crack.status_code == 200
        assert res_healthy.status_code == 200
        assert res_crack.json()["has_crack"] == True
        assert res_healthy.json()["has_crack"] == False
        print("\n[PASSED] Real Concrete Crack Detection AI API test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
