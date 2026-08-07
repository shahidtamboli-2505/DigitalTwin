"""
Redis async client for caching, sessions, real-time pub/sub.
Uses redis-py with hiredis for performance.
"""

import redis.asyncio as aioredis

from app.core.config import get_settings

settings = get_settings()

# ── Redis connection pool ────────────────────────────────────
redis_pool = aioredis.ConnectionPool.from_url(
    settings.redis_url,
    max_connections=20,
    decode_responses=True,
)

redis_client = aioredis.Redis(connection_pool=redis_pool)


# ── Key prefixes ─────────────────────────────────────────────
class RedisKeys:
    """Centralized Redis key patterns."""

    SESSION = "session:{user_id}"
    DASHBOARD_CACHE = "cache:dashboard:{user_id}"
    WEATHER_CURRENT = "cache:weather:current"
    INFRA_LIST = "cache:infrastructure:list"
    RATE_LIMIT = "rate_limit:{ip}"
    WS_CONNECTIONS = "ws:connections"
    LIVE_SENSOR = "live:sensors:{sensor_id}"
    LIVE_ALERTS = "live:alerts"
    NOTIFICATION_QUEUE = "queue:notifications"
    REPORT_LOCK = "lock:report:{id}"

    @staticmethod
    def session(user_id: str) -> str:
        return f"session:{user_id}"

    @staticmethod
    def dashboard_cache(user_id: str) -> str:
        return f"cache:dashboard:{user_id}"

    @staticmethod
    def live_sensor(sensor_id: str) -> str:
        return f"live:sensors:{sensor_id}"

    @staticmethod
    def rate_limit(ip: str) -> str:
        return f"rate_limit:{ip}"

    @staticmethod
    def report_lock(report_id: str) -> str:
        return f"lock:report:{report_id}"


# ── TTL constants (seconds) ──────────────────────────────────
class RedisTTL:
    SESSION = 86400        # 24 hours
    DASHBOARD = 300        # 5 minutes
    WEATHER = 900          # 15 minutes
    INFRA_LIST = 600       # 10 minutes
    RATE_LIMIT = 60        # 1 minute
    LIVE_SENSOR = 30       # 30 seconds
    REPORT_LOCK = 300      # 5 minutes


async def ping_redis() -> bool:
    """Check if Redis is reachable."""
    try:
        return await redis_client.ping()
    except Exception:
        return False


async def close_redis() -> None:
    """Close the Redis connection pool gracefully."""
    await redis_pool.aclose()
