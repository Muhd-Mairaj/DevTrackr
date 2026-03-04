import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import DateTime, Field, Relationship

from .base import BaseModel
from .base_types import EncryptedString

if TYPE_CHECKING:
    from .user import User


class Integration(BaseModel, table=True):
    provider: str = Field(index=True)
    access_token: str = Field(sa_type=EncryptedString, nullable=False)  # type: ignore[call-overload]
    refresh_token: str | None = Field(
        default=None,
        sa_type=EncryptedString,
        nullable=True,  # type: ignore[call-overload]
    )
    token_expiry: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
    )
    account_id: str = Field(index=True, max_length=320)
    account_email: str = Field(max_length=320)

    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )
    user: "User" = Relationship(back_populates="integrations")
