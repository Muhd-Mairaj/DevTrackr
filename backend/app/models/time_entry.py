import uuid
from datetime import datetime

from sqlmodel import DateTime, Field

from .base import BaseModel


class TimeEntry(BaseModel, table=True):
    __tablename__ = "time_entry"

    description: str | None = Field(default=None)
    start_time: datetime = Field(
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        nullable=False,
    )
    end_time: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        nullable=True,
    )
    duration_seconds: int | None = None
    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, ondelete="CASCADE"
    )
