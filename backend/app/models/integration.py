import uuid
from datetime import datetime

from sqlmodel import DateTime, Field

from .base import BaseModel
from .base_types import EncryptedString


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
    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )
