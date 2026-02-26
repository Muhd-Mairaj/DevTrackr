import uuid

from sqlmodel import Field

from .base import BaseModel


class Repository(BaseModel, table=True):
    repo_name: str
    url: str | None = None
    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, ondelete="CASCADE"
    )
