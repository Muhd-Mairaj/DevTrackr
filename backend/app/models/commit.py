import uuid
from datetime import datetime

from sqlmodel import DateTime, Field, SQLModel

from .base import BaseModel


class CommitBase(SQLModel):
    sha: str
    message: str
    committed_at: datetime = Field(
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        nullable=False,
    )
    url: str | None = None


class CommitCreate(CommitBase):
    pass


class Commit(CommitBase, BaseModel, table=True):
    repository_id: uuid.UUID = Field(
        foreign_key="repository.id", nullable=False, ondelete="CASCADE"
    )
