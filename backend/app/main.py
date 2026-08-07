"""
FastAPI Application Entry Point.
AI-Powered Digital Twin for Critical Infrastructure Risk Assessment.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application startup and shutdown events."""
    # ── Startup ──────────────────────────────────────────────
    print(f"🚀 Starting {settings.app_name} in {settings.app_env} mode")
    print(f"📡 API docs available at http://localhost:{settings.app_port}/docs")

    # Initialize MongoDB indexes
    try:
        from app.core.mongodb import init_mongodb_indexes
        await init_mongodb_indexes()
        print("📦 MongoDB indexes created")
    except Exception as e:
        print(f"⚠️  MongoDB connection skipped: {e}")

    # Verify Redis connection
    try:
        from app.core.redis import ping_redis
        if await ping_redis():
            print("🔴 Redis connected")
        else:
            print("⚠️  Redis ping failed")
    except Exception as e:
        print(f"⚠️  Redis connection skipped: {e}")

    yield

    # ── Shutdown ─────────────────────────────────────────────
    print(f"🛑 Shutting down {settings.app_name}")
    try:
        from app.core.mongodb import close_mongodb
        from app.core.redis import close_redis
        await close_mongodb()
        await close_redis()
        print("✅ Database connections closed")
    except Exception:
        pass


# ── Create FastAPI application ───────────────────────────────
app = FastAPI(
    title="Digital Twin API",
    description=(
        "AI-Powered Digital Twin for Critical Infrastructure "
        "Risk Assessment and Disaster Management — Sangli District"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint — confirms the API is running."""
    return {
        "status": "online",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {"status": "healthy"}


@app.get("/api/health/detailed", tags=["Health"])
async def detailed_health_check():
    """Detailed health check — tests database connections."""
    health = {"api": "healthy", "postgres": "unknown", "mongodb": "unknown", "redis": "unknown"}

    try:
        from app.core.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health["postgres"] = "healthy"
    except Exception as e:
        health["postgres"] = f"unhealthy: {str(e)[:50]}"

    try:
        from app.core.mongodb import client as mongo_client
        await mongo_client.admin.command("ping")
        health["mongodb"] = "healthy"
    except Exception as e:
        health["mongodb"] = f"unhealthy: {str(e)[:50]}"

    try:
        from app.core.redis import ping_redis
        if await ping_redis():
            health["redis"] = "healthy"
        else:
            health["redis"] = "unhealthy: ping failed"
    except Exception as e:
        health["redis"] = f"unhealthy: {str(e)[:50]}"

    all_healthy = all(v == "healthy" for v in health.values())
    return {"status": "healthy" if all_healthy else "degraded", "services": health}


# ── Global Exception Handler ────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch unhandled exceptions and return a clean JSON response."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.app_debug else "An unexpected error occurred",
        },
    )
