import uuid
from sqlmodel import Field
from .base import BaseModel

class Logbook(BaseModel, table=True):
    title: str
    content: str
    ai_summary: str | None = None
    project_id: uuid.UUID = Field(foreign_key="project.id", nullable=False, ondelete="CASCADE")