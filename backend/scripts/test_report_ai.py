import asyncio
import sys
import os
import httpx
sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

async def main():
    print("Testing Gemini AI Executive Report Summary API (/api/ai/report-summary)...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/ai/report-summary", json={"district": "Sangli District"})
        print(f"Report Summary Status: {res.status_code}")
        report = res.json()
        print("Title:", report["title"])
        print("Summary:", report["executive_summary"])
        print("Action Plan:", report["recommended_action_plan"])

        assert res.status_code == 200
        assert "Sangli" in report["executive_summary"]
        assert len(report["recommended_action_plan"]) >= 3
        print("\n[PASSED] Gemini AI Executive Report Summary test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
