import uuid
from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

from .base import BaseModel

if TYPE_CHECKING:
    from .integration import Integration


class UserBase(SQLModel):
    email: EmailStr = Field(index=True, unique=True, nullable=False)
    username: str = Field(nullable=False)


class User(UserBase, BaseModel, table=True):
    __tablename__ = "users"

    # Nullable so that users who sign up via GitHub OAuth don't need a password.
    hashed_password: str | None = Field(default=None, nullable=True)

    integrations: list["Integration"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"lazy": "joined"}
    )


class UserCreate(UserBase):
    password: str


class UserLogin(SQLModel):
    email: EmailStr
    password: str


class UserPublic(UserBase):
    id: uuid.UUID
    is_active: bool

    model_config = {"from_attributes": True}


class AuthResponse(SQLModel):
    user: UserPublic
    message: str = "ok"
