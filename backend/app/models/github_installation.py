import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Column, DateTime, Field, Relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .user import User


class GitHubInstallation(BaseModel, table=True):
    __tablename__ = "github_installation"

    # GitHub-assigned installation id
    installation_id: str = Field(unique=True, index=True, max_length=64)

    # The GitHub account the App is installed on.
    account_login: str = Field(max_length=255)
    account_id: str = Field(index=True, max_length=64)
    account_type: str = Field(max_length=32)  # "User" | "Organization"

    # Set when GitHub suspends the installation
    suspended_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )

    # The DevTrackr user who connected this installation
    user_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="SET NULL",
        nullable=True,
        index=True,
    )
    user: Optional["User"] = Relationship(back_populates="github_installations")
