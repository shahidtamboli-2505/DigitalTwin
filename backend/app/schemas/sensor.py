"""
Sensor schemas — sensor registry and readings.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SensorCreate(BaseModel):
    infrastructure_id: UUID
    sensor_type: str = Field(max_length=50)
    unit: str = Field(max_length=20)
    min_threshold: float | None = None
    max_threshold: float | None = None


class SensorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    infrastructure_id: UUID
    sensor_type: str
    unit: str
    min_threshold: float | None = None
    max_threshold: float | None = None
    status: str
    last_reading_value: float | None = None
    last_reading_at: datetime | None = None
    created_at: datetime


class SensorReadingCreate(BaseModel):
    """For inserting sensor readings into MongoDB."""
    sensor_id: str
    values: dict  # {temp: 32.5, humidity: 78, ...}


class SensorReadingResponse(BaseModel):
    sensor_id: str
    timestamp: datetime
    values: dict
