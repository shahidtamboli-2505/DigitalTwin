"""
Celery application for background task processing.
Handles weather sync, sensor simulation, report generation, alerts.
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

# ── Create Celery app ────────────────────────────────────────
celery_app = Celery(
    "digital_twin",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

# ── Configuration ────────────────────────────────────────────
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,           # 5 min hard limit
    task_soft_time_limit=240,      # 4 min soft limit
    worker_prefetch_multiplier=1,  # Fair task distribution
    worker_max_tasks_per_child=100,
)

# ── Auto-discover tasks from app.tasks module ────────────────
celery_app.autodiscover_tasks(["app.tasks"])

# ── Periodic task schedule (Celery Beat) ─────────────────────
celery_app.conf.beat_schedule = {
    # Sync weather data every 30 minutes
    "sync-weather-data": {
        "task": "app.tasks.weather_sync.sync_weather",
        "schedule": crontab(minute="*/30"),
    },
    # Run sensor simulation every 10 seconds
    "simulate-sensors": {
        "task": "app.tasks.sensor_sync.simulate_sensor_readings",
        "schedule": 10.0,
    },
    # Update health scores every hour
    "update-health-scores": {
        "task": "app.tasks.health_update.recalculate_health_scores",
        "schedule": crontab(minute=0),
    },
    # Check alert conditions every 5 minutes
    "check-alerts": {
        "task": "app.tasks.alert_scheduler.check_alert_conditions",
        "schedule": crontab(minute="*/5"),
    },
    # Cleanup old data daily at 2 AM IST
    "cleanup-old-data": {
        "task": "app.tasks.data_cleanup.cleanup_expired_data",
        "schedule": crontab(hour=2, minute=0),
    },
}
