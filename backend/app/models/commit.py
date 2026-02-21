import uuid
from sqlmodel import Field
from .base import BaseModel
from datetime import datetime

class Commit(BaseModel, table=True):
    sha: str
    message: str
    committed_at: datetime
    url: str | None = None
    repository_id: uuid.UUID = Field(foreign_key="repository.id", nullable=False, ondelete="CASCADE")
    