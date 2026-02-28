import uuid
from datetime import datetime

from sqlmodel import DateTime, Field

from .base import BaseModel


class Commit(BaseModel, table=True):
    sha: str
    message: str
    committed_at: datetime = Field(sa_type=DateTime(timezone=True), nullable=False)
    url: str | None = None
    repository_id: uuid.UUID = Field(
        foreign_key="repository.id", nullable=False, ondelete="CASCADE"
    )
