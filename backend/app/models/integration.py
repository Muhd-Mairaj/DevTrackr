import uuid
from datetime import datetime

from sqlalchemy import Column
from sqlmodel import DateTime, Field

from .base import BaseModel
from .base_types import EncryptedString


class Integration(BaseModel, table=True):
    provider: str = Field(index=True)
    access_token: str = Field(sa_column=Column(EncryptedString, nullable=False))
    refresh_token: str | None = Field(
        default=None, sa_column=Column(EncryptedString, nullable=True)
    )
    token_expiry: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )
