import uuid

from sqlmodel import Field, SQLModel

from .base import BaseModel


class LogbookBase(SQLModel):
    title: str
    content: str
    ai_summary: str | None = None


class LogbookCreate(LogbookBase):
    pass


class LogbookUpdate(SQLModel):
    title: str | None = None
    content: str | None = None
    ai_summary: str | None = None


class Logbook(LogbookBase, BaseModel, table=True):
    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, ondelete="CASCADE"
    )
