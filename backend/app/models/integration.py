import uuid
from datetime import datetime
from sqlmodel import Field, DateTime
from .base import BaseModel


class Integration(BaseModel, table=True):
    provider: str = Field(index=True)
    access_token: str
    refresh_token: str | None = Field(default=None)
    token_expiry: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True)
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )