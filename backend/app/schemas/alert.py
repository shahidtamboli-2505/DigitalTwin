"""
Alert schemas — alert CRUD and filtering.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AlertCreate(BaseModel):
    infrastructure_id: UUID | None = None
    alert_type: str = Field(max_length=50)
    severity: str = Field(max_length=20)
    title: str = Field(max_length=255)
    description: str | None = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    infrastructure_id: UUID | None = None
    alert_type: str
    severity: str
    title: str
    description: str | None = None
    status: str
    acknowledged: bool
    acknowledged_at: datetime | None = None
    resolved_at: datetime | None = None
    created_at: datetime


class AlertFilter(BaseModel):
    severity: str | None = None
    alert_type: str | None = None
    status: str | None = None
    infrastructure_id: UUID | None = None
