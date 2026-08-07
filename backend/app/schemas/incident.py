"""
Incident schemas.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class IncidentCreate(BaseModel):
    alert_id: UUID | None = None
    infrastructure_id: UUID | None = None
    title: str = Field(max_length=255)
    description: str | None = None
    priority: str = "medium"
    latitude: float | None = None
    longitude: float | None = None


class IncidentUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    description: str | None = None


class IncidentAssign(BaseModel):
    officer_id: UUID | None = None
    engineer_id: UUID | None = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alert_id: UUID | None = None
    infrastructure_id: UUID | None = None
    title: str
    description: str | None = None
    status: str
    priority: str
    reported_at: datetime
    resolved_at: datetime | None = None
