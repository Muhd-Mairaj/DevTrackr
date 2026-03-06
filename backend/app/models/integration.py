import uuid
from datetime import datetime
from typing import TYPE_CHECKING, TypedDict

from sqlmodel import DateTime, Field, Relationship, SQLModel

from .base import BaseModel
from .base_types import EncryptedString

if TYPE_CHECKING:
    from .user import User


class OAuth2Token(TypedDict):
    access_token: str
    token_type: str
    refresh_token: str | None
    expires_at: int | None


class IntegrationBase(SQLModel):
    provider: str = Field(index=True)
    account_id: str = Field(index=True, max_length=320)
    account_email: str = Field(max_length=320)


class IntegrationCreate(IntegrationBase):
    access_token: str
    refresh_token: str | None = None
    token_expiry: datetime | None = None


class IntegrationUpdate(SQLModel):
    access_token: str | None = None
    refresh_token: str | None = None
    token_expiry: datetime | None = None
    account_email: str | None = None


class Integration(IntegrationBase, BaseModel, table=True):
    access_token: str = Field(sa_type=EncryptedString, nullable=False)
    refresh_token: str | None = Field(
        default=None,
        sa_type=EncryptedString,
        nullable=True,
    )
    token_expiry: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
    )

    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )
    user: "User" = Relationship(back_populates="integrations")

    def to_token(self) -> OAuth2Token:
        return {
            "access_token": self.access_token,
            "token_type": "bearer",
            "refresh_token": self.refresh_token,
            "expires_at": int(self.token_expiry.timestamp())
            if self.token_expiry
            else None,
        }
