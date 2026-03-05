import uuid
from typing import TYPE_CHECKING

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
    name: str | None = Field(default=None)
    description: str | None = Field(default=None)


class Project(ProjectBase, BaseModel, table=True):
    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )

    user: "User" = Relationship()
