"""
Common Pydantic schemas — pagination, response wrappers, shared types.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PaginationParams(BaseModel):
    """Query parameters for paginated endpoints."""
    page: int = 1
    page_size: int = 20
    sort_by: str = "created_at"
    sort_order: str = "desc"  # asc | desc


class PaginatedResponse(BaseModel):
    """Wrapper for paginated API responses."""
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    message: str = "OK"
    data: dict | list | None = None


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = False
    message: str
    detail: str | None = None
    errors: list[dict] | None = None


class TimestampMixin(BaseModel):
    """Common timestamp fields."""
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    updated_at: datetime | None = None


class IDMixin(BaseModel):
    """Common ID field."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
