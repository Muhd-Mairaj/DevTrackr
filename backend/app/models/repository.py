import uuid
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from .base import BaseModel
from .project_repository import ProjectRepository

if TYPE_CHECKING:
    from .project import Project


class RepositoryBase(SQLModel):
    github_id: int = Field(index=True, unique=True)
    full_name: str = Field(index=True)
    description: str | None = None
    repo_name: str
    url: str | None = None


class RepositoryCreate(RepositoryBase):
    pass


class RepositoryUpdate(SQLModel):
    repo_name: str | None = None
    url: str | None = None


class Repository(RepositoryBase, BaseModel, table=True):
    projects: list["Project"] = Relationship(
        back_populates="repositories", link_model=ProjectRepository
    )


class RepositoryPublic(SQLModel):
    id: uuid.UUID
    github_id: int
    full_name: str
    repo_name: str
    url: str | None
    description: str | None
