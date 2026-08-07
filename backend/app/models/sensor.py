"""
Sensor model — IoT sensor registry and configuration.
"""

import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sensor(Base):
    __tablename__ = "sensors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("infrastructure.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sensor_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # vibration, temperature, humidity, water_level, strain, tilt, crack_width
    unit: Mapped[str] = mapped_column(String(20), nullable=False)  # °C, mm, %, m, g
    min_threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )  # active, inactive, faulty, maintenance
    location = mapped_column(
        Geometry("POINT", srid=4326), nullable=True
    )
    last_reading_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_reading_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    installed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationship
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure", back_populates="sensors"
    )

    def __repr__(self) -> str:
        return f"<Sensor {self.sensor_type} on {self.infrastructure_id}>"
