import uuid
from sqlmodel import Field
from .base import BaseModel
from datetime import datetime

class TimeEntry(BaseModel, table=True):
    __tablename__ = "time_entry"
    
    description: str | None = Field(default=None)
    start_time: datetime = Field(nullable=False)
    end_time: datetime | None = None
    duration_seconds: int | None = None
    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False, ondelete="CASCADE")
