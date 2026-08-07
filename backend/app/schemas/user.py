"""
User schemas — profile, user list, admin views.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    phone: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    phone: str | None = None
    avatar_url: str | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    last_login: datetime | None = None
    created_at: datetime
    roles: list[str] = []


class UserBriefResponse(BaseModel):
    """Minimal user info for embedding in other responses."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str
    avatar_url: str | None = None


class AssignRoleRequest(BaseModel):
    role_name: str
