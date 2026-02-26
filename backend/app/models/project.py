import uuid

from sqlmodel import Field

from .base import BaseModel


class Project(BaseModel, table=True):
    name: str = Field(index=True)
    description: str | None = Field(default=None)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
