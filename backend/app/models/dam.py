"""
Dam model — type-specific fields for dam infrastructure.
"""

import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Dam(Base):
    __tablename__ = "dams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("infrastructure.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    height: Mapped[float | None] = mapped_column(Float, nullable=True)
    capacity_mcm: Mapped[float | None] = mapped_column(Float, nullable=True)  # Million Cubic Meters
    dam_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # earthen, gravity, arch, buttress
    river: Mapped[str | None] = mapped_column(String(100), nullable=True)
    current_level: Mapped[float | None] = mapped_column(Float, nullable=True)
    danger_level: Mapped[float | None] = mapped_column(Float, nullable=True)
    full_reservoir_level: Mapped[float | None] = mapped_column(Float, nullable=True)
    geometry = mapped_column(
        Geometry("POLYGON", srid=4326), nullable=True
    )

    # Relationship
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure", back_populates="dam"
    )

    def __repr__(self) -> str:
        return f"<Dam infra_id={self.infrastructure_id}>"
