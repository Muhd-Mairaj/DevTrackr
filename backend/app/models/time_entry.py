import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import model_validator
from sqlmodel import Column, DateTime, Field, SQLModel

from .base import BaseModel


def _validate_time_fields(
    start_time: datetime | None,
    end_time: datetime | None,
    duration_seconds: int | None,
) -> None:
    """Cross-field sanity for time entry payloads (mirrors ProjectUpdate's
    model_validator pattern; FastAPI surfaces failures as 422)."""
    if start_time is not None and end_time is not None:
        if end_time <= start_time:
            raise ValueError("end_time must be after start_time")
        if (
            duration_seconds is not None
            and int((end_time - start_time).total_seconds()) != duration_seconds
        ):
            raise ValueError("duration_seconds must equal end_time minus start_time")


class _TimeEntryValidation(SQLModel):
    if TYPE_CHECKING:
        start_time: datetime | None
        end_time: datetime | None
        duration_seconds: int | None

    @model_validator(mode="after")
    def check_time_fields(self) -> "_TimeEntryValidation":
        _validate_time_fields(self.start_time, self.end_time, self.duration_seconds)
        return self


class TimeEntryBase(_TimeEntryValidation):
    description: str | None = Field(default=None)
    start_time: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    end_time: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    duration_seconds: int | None = None


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryUpdate(_TimeEntryValidation):
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_seconds: int | None = None


class TimeEntry(TimeEntryBase, BaseModel, table=True):
    __tablename__ = "time_entry"

    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, ondelete="CASCADE"
    )


class TimeEntryPublic(TimeEntryBase, BaseModel):
    project_id: uuid.UUID
