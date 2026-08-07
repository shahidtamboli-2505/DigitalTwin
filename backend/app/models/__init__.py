"""
SQLAlchemy models — import all models here for Alembic auto-discovery.
"""

from app.models.user import User
from app.models.role import Role, Permission, UserRole, RolePermission
from app.models.infrastructure import Infrastructure
from app.models.bridge import Bridge
from app.models.road import Road
from app.models.dam import Dam
from app.models.hospital import Hospital
from app.models.sensor import Sensor
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.inspection import Inspection
from app.models.maintenance import Maintenance
from app.models.weather import WeatherStation
from app.models.report import (
    Report,
    Notification,
    Attachment,
    AuditLog,
    RiskPrediction,
    FloodPrediction,
)

__all__ = [
    "User",
    "Role",
    "Permission",
    "UserRole",
    "RolePermission",
    "Infrastructure",
    "Bridge",
    "Road",
    "Dam",
    "Hospital",
    "Sensor",
    "Alert",
    "Incident",
    "Inspection",
    "Maintenance",
    "WeatherStation",
    "Report",
    "Notification",
    "Attachment",
    "AuditLog",
    "RiskPrediction",
    "FloodPrediction",
]
