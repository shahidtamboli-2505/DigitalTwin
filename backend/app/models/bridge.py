"""
Bridge model — type-specific fields for bridge infrastructure.
"""

import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Bridge(Base):
    __tablename__ = "bridges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("infrastructure.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    span_length: Mapped[float | None] = mapped_column(Float, nullable=True)
    width: Mapped[float | None] = mapped_column(Float, nullable=True)
    bridge_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # arch, beam, suspension, truss, cable-stayed
    load_capacity_tons: Mapped[float | None] = mapped_column(Float, nullable=True)
    over_feature: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # river name / road
    lanes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    geometry = mapped_column(
        Geometry("LINESTRING", srid=4326), nullable=True
    )

    # Relationship
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure", back_populates="bridge"
    )

    def __repr__(self) -> str:
        return f"<Bridge infra_id={self.infrastructure_id}>"
