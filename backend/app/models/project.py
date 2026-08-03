import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import model_validator
from sqlmodel import Field, Relationship, SQLModel

from .base import BaseModel

if TYPE_CHECKING:
    from .user import User


class ProjectBase(SQLModel):
    name: str = Field(index=True)
    description: str | None = Field(default=None)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None)

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

    user: "User" = Relationship()


class ProjectPublic(ProjectBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    user_id: uuid.UUID
