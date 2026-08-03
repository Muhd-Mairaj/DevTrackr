import uuid
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

from .base import BaseModel
from .project_repository import ProjectRepository

if TYPE_CHECKING:
    from .project import Project
    from .user import User


class RepositoryBase(SQLModel):
    github_id: int = Field(index=True)
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
    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )

    # Uniqueness is per owner: the same GitHub repo (github_id) is synced
    # separately for each user's installation, so the composite key is what
    # prevents duplicate syncs.
    __table_args__ = (
        UniqueConstraint(
            "github_id", "user_id", name="uq_repository_github_id_user_id"
        ),
    )

    user: "User" = Relationship()

    projects: list["Project"] = Relationship(
        back_populates="repositories", link_model=ProjectRepository
    )


class RepositoryPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    github_id: int
    full_name: str
    repo_name: str
    url: str | None
    description: str | None
