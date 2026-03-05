import uuid

from sqlmodel import Field, SQLModel

from .base import BaseModel


class RepositoryBase(SQLModel):
    repo_name: str
    url: str | None = None


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryUpdate(SQLModel):
    repo_name: str | None = None
    url: str | None = None


class Repository(RepositoryBase, BaseModel, table=True):
    project_id: uuid.UUID = Field(
        foreign_key="project.id", nullable=False, ondelete="CASCADE"
    )
