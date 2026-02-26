import uuid
from sqlmodel import Field, DateTime
from .base import BaseModel
from datetime import datetime

class TimeEntry(BaseModel, table=True):
    __tablename__ = "time_entry"
    
    description: str | None = Field(default=None)
    start_time: datetime = Field(
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    end_time: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True)
    )
    duration_seconds: int | None = None
    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False, ondelete="CASCADE")
