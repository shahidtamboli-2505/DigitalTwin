"""
Infrastructure schemas — CRUD operations, filtering, detail views.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Base Infrastructure ──────────────────────────────────────
class InfrastructureCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    type: str = Field(max_length=50)  # bridge, road, dam, hospital
    category: str | None = None
    district: str = "Sangli"
    taluka: str | None = None
    village: str | None = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    construction_year: int | None = None
    material: str | None = None
    description: str | None = None
    owner: str | None = None


class InfrastructureUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    category: str | None = None
    current_status: str | None = None
    material: str | None = None
    description: str | None = None
    owner: str | None = None
    assigned_officer_id: UUID | None = None


class InfrastructureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: str
    category: str | None = None
    district: str
    taluka: str | None = None
    village: str | None = None
    latitude: float
    longitude: float
    construction_year: int | None = None
    material: str | None = None
    current_status: str
    health_score: float | None = None
    risk_score: float | None = None
    description: str | None = None
    owner: str | None = None
    created_at: datetime


class InfrastructureBriefResponse(BaseModel):
    """Minimal info for list views and map markers."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: str
    latitude: float
    longitude: float
    current_status: str
    health_score: float | None = None
    risk_score: float | None = None


# ── Bridge ───────────────────────────────────────────────────
class BridgeCreate(BaseModel):
    span_length: float | None = None
    width: float | None = None
    bridge_type: str | None = None
    load_capacity_tons: float | None = None
    over_feature: str | None = None
    lanes: int | None = None


class BridgeResponse(BridgeCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID


# ── Road ─────────────────────────────────────────────────────
class RoadCreate(BaseModel):
    length_km: float | None = None
    surface_type: str | None = None
    lanes: int | None = None
    road_class: str | None = None
    width: float | None = None


class RoadResponse(RoadCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID


# ── Dam ──────────────────────────────────────────────────────
class DamCreate(BaseModel):
    height: float | None = None
    capacity_mcm: float | None = None
    dam_type: str | None = None
    river: str | None = None
    current_level: float | None = None
    danger_level: float | None = None
    full_reservoir_level: float | None = None


class DamResponse(DamCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID


# ── Hospital ─────────────────────────────────────────────────
class HospitalCreate(BaseModel):
    hospital_type: str | None = None
    bed_count: int | None = None
    specializations: str | None = None
    emergency_capacity: int | None = None
    ambulance_count: int | None = None
    flood_risk_zone: bool = False
    elevation_m: float | None = None


class HospitalResponse(HospitalCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID


# ── Filter ───────────────────────────────────────────────────
class InfrastructureFilter(BaseModel):
    type: str | None = None
    status: str | None = None
    district: str | None = None
    taluka: str | None = None
    min_health_score: float | None = None
    max_health_score: float | None = None
    min_risk_score: float | None = None
    max_risk_score: float | None = None
    search: str | None = None
