"""
Road model — type-specific fields for road infrastructure.
"""

import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Road(Base):
    __tablename__ = "roads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("infrastructure.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    length_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    surface_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # asphalt, concrete, gravel, dirt
    lanes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    road_class: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )  # national, state, district, village
    width: Mapped[float | None] = mapped_column(Float, nullable=True)
    geometry = mapped_column(
        Geometry("LINESTRING", srid=4326), nullable=True
    )

    # Relationship
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure", back_populates="road"
    )

    def __repr__(self) -> str:
        return f"<Road infra_id={self.infrastructure_id}>"
