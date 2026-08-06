import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import model_validator
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

from .base import BaseModel
from .project_repository import ProjectRepository
from .repository import RepositoryPublic

if TYPE_CHECKING:
    from .repository import Repository
    from .user import User


class ProjectBase(SQLModel):
    name: str = Field(index=True)
    description: str | None = Field(default=None)


class ProjectCreate(ProjectBase):
    repository_ids: list[int] | None = None


class ProjectUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None)
    repository_ids: list[int] | None = None

    @model_validator(mode="after")
    def reject_null_name(self) -> "ProjectUpdate":
        # PATCH semantics: an absent name means "no change", but an explicit
        # null would violate the NOT NULL column and surface as a raw 500.
        if "name" in self.model_fields_set and self.name is None:
            raise ValueError("name cannot be null")
        return self


class Project(ProjectBase, BaseModel, table=True):
    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )

    # Per-project logbook column configuration. A list of
    # {kind, name, builtin} items; NULL means "use defaults"
    column_config: list[dict[str, Any]] | None = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )

    user: "User" = Relationship()

    repositories: list["Repository"] = Relationship(
        back_populates="projects",
        link_model=ProjectRepository,
        # Eager-load so ProjectPublic serialization never lazy-loads (async
        # sessions raise on lazy relationship access after commit).
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class ProjectPublic(ProjectBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    user_id: uuid.UUID
    repositories: list[RepositoryPublic] = Field(default_factory=list)
