import uuid
from datetime import datetime

from sqlmodel import DateTime, Field, SQLModel

from .base import BaseModel


class TimeEntryBase(SQLModel):
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


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryUpdate(SQLModel):
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_seconds: int | None = None


class TimeEntry(TimeEntryBase, BaseModel, table=True):
    __tablename__ = "time_entry"

    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, ondelete="CASCADE"
    )
