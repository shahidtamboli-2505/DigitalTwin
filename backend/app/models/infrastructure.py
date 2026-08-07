"""
Infrastructure model — base table for all critical assets.
Uses PostGIS GEOMETRY for spatial queries.
"""

import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # bridge, road, dam, hospital, railway
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, default="Sangli")
    taluka: Mapped[str | None] = mapped_column(String(100), nullable=True)
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location = mapped_column(
        Geometry("POINT", srid=4326), nullable=True
    )
    construction_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    material: Mapped[str | None] = mapped_column(String(100), nullable=True)
    current_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="operational"
    )  # operational, degraded, critical, under_maintenance, decommissioned
    health_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner: Mapped[str | None] = mapped_column(String(200), nullable=True)
    assigned_officer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    is_deleted: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ────────────────────────────────────────
    assigned_officer: Mapped["User"] = relationship("User", foreign_keys=[assigned_officer_id])
    bridge: Mapped["Bridge | None"] = relationship(
        "Bridge", back_populates="infrastructure", uselist=False, cascade="all, delete-orphan"
    )
    road: Mapped["Road | None"] = relationship(
        "Road", back_populates="infrastructure", uselist=False, cascade="all, delete-orphan"
    )
    dam: Mapped["Dam | None"] = relationship(
        "Dam", back_populates="infrastructure", uselist=False, cascade="all, delete-orphan"
    )
    hospital: Mapped["Hospital | None"] = relationship(
        "Hospital", back_populates="infrastructure", uselist=False, cascade="all, delete-orphan"
    )
    sensors: Mapped[list["Sensor"]] = relationship(
        "Sensor", back_populates="infrastructure", cascade="all, delete-orphan"
    )
    inspections: Mapped[list["Inspection"]] = relationship(
        "Inspection", back_populates="infrastructure", cascade="all, delete-orphan"
    )
    maintenance_records: Mapped[list["Maintenance"]] = relationship(
        "Maintenance", back_populates="infrastructure", cascade="all, delete-orphan"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        "Alert", back_populates="infrastructure", cascade="all, delete-orphan"
    )
    risk_predictions: Mapped[list["RiskPrediction"]] = relationship(
        "RiskPrediction", back_populates="infrastructure", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment", back_populates="infrastructure", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Infrastructure {self.name} ({self.type})>"
