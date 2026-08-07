"""
Report schemas.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReportGenerateRequest(BaseModel):
    report_type: str = Field(max_length=50)
    title: str = Field(max_length=255)
    format: str = "pdf"  # pdf, excel, csv
    parameters: dict | None = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    report_type: str
    title: str
    format: str
    file_url: str | None = None
    parameters: dict | None = None
    created_at: datetime
