"""
Inspection model — periodic infrastructure inspection records.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("infrastructure.id", ondelete="CASCADE"),
        nullable=False,
    )
    inspector_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    inspection_date: Mapped[date] = mapped_column(Date, nullable=False)
    inspection_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="routine"
    )  # routine, emergency, post_disaster, structural
    findings: Mapped[str | None] = mapped_column(Text, nullable=True)
    condition_rating: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # excellent, good, fair, poor, critical
    recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_inspection_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure", back_populates="inspections"
    )
    inspector: Mapped["User"] = relationship("User", foreign_keys=[inspector_id])

    def __repr__(self) -> str:
        return f"<Inspection {self.inspection_date} for {self.infrastructure_id}>"
