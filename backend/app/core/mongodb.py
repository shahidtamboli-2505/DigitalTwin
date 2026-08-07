"""
MongoDB async client using Motor.
Handles sensor readings, AI predictions, event logs.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

settings = get_settings()

# ── Motor client (lazy connect) ──────────────────────────────
client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.mongodb_url,
    maxPoolSize=50,
    minPoolSize=5,
    serverSelectionTimeoutMS=5000,
)

# ── Database reference ───────────────────────────────────────
db: AsyncIOMotorDatabase = client[settings.mongodb_db_name]

# ── Collection references ────────────────────────────────────
sensor_readings = db["sensor_readings"]
ai_predictions = db["ai_predictions"]
ai_reports = db["ai_reports"]
event_logs = db["event_logs"]
notification_logs = db["notification_logs"]
weather_history = db["weather_history"]
simulation_results = db["simulation_results"]


async def init_mongodb_indexes() -> None:
    """Create indexes on first startup."""
    # Sensor readings: compound index for fast queries
    await sensor_readings.create_index(
        [("sensor_id", 1), ("timestamp", -1)],
        name="idx_sensor_time",
    )
    # TTL: auto-delete readings older than 90 days
    await sensor_readings.create_index(
        "timestamp",
        expireAfterSeconds=90 * 24 * 3600,
        name="ttl_sensor_readings",
    )
    # AI predictions: model + time
    await ai_predictions.create_index(
        [("model", 1), ("timestamp", -1)],
        name="idx_model_time",
    )
    # Weather: location + date
    await weather_history.create_index(
        [("location", 1), ("date", -1)],
        name="idx_location_date",
    )


async def close_mongodb() -> None:
    """Close the Motor client gracefully."""
    client.close()
