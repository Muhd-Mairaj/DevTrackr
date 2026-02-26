import uuid
from datetime import datetime

from sqlmodel import Field

from .base import BaseModel


class Integration(BaseModel, table=True):
    provider: str = Field(index=True)
    access_token: str
    refresh_token: str | None = Field(default=None)
    token_expiry: datetime | None = Field(default=None)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
