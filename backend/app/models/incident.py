"""
Incident model — disaster/incident tracking and response workflow.
"""

import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    alert_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("alerts.id"), nullable=True
    )
    infrastructure_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("infrastructure.id"), nullable=True
    )
    assigned_officer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    assigned_engineer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="reported"
    )  # reported, investigating, in_progress, resolved, closed
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium"
    )  # critical, high, medium, low
    location = mapped_column(
        Geometry("POINT", srid=4326), nullable=True
    )
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    alert: Mapped["Alert | None"] = relationship("Alert", back_populates="incidents")
    infrastructure: Mapped["Infrastructure | None"] = relationship("Infrastructure")
    assigned_officer: Mapped["User | None"] = relationship(
        "User", foreign_keys=[assigned_officer_id]
    )
    assigned_engineer: Mapped["User | None"] = relationship(
        "User", foreign_keys=[assigned_engineer_id]
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment", back_populates="incident"
    )

    def __repr__(self) -> str:
        return f"<Incident {self.priority}: {self.title}>"
