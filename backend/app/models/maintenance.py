"""
Maintenance model — maintenance work orders and history.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Maintenance(Base):
    __tablename__ = "maintenance"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    infrastructure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("infrastructure.id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    work_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # preventive, corrective, emergency, rehabilitation
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="scheduled"
    )  # scheduled, in_progress, completed, cancelled
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium"
    )
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)  # in INR
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    infrastructure: Mapped["Infrastructure"] = relationship(
        "Infrastructure", back_populates="maintenance_records"
    )
    assigned_to: Mapped["User | None"] = relationship(
        "User", foreign_keys=[assigned_to_id]
    )

    def __repr__(self) -> str:
        return f"<Maintenance {self.work_type} - {self.status}>"
