"""
Hospital model — type-specific fields for hospital infrastructure.
"""

import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("infrastructure.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    hospital_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # government, private, primary_health_center
    bed_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    specializations: Mapped[str | None] = mapped_column(String(500), nullable=True)
    emergency_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ambulance_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    flood_risk_zone: Mapped[bool] = mapped_column(default=False)
    elevation_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    location = mapped_column(
        Geometry("POINT", srid=4326), nullable=True
    )

    # Relationship
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure", back_populates="hospital"
    )

    def __repr__(self) -> str:
        return f"<Hospital infra_id={self.infrastructure_id}>"
