import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlmodel import DateTime, Field, Relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .user import User


# Refresh token
class UserSessionToken(BaseModel, table=True):
    __tablename__ = "user_session_tokens"

    # Token data
    token_hash: str = Field(index=True, nullable=False)
    expires_at: datetime = Field(
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        nullable=False,
    )
    is_revoked: bool = Field(default=False)

    # Device identification (for anomaly detection)
    device_fingerprint: str | None = Field(default=None, max_length=255)

    # Display metadata (for user session management)
    device_name: str | None = Field(
        default=None, max_length=200
    )  # Chrome on Windows, iPhone Safari, etc.
    device_type: str | None = Field(
        default=None, max_length=100
    )  # desktop, mobile, tablet

    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE"
    )
    user: "User" = Relationship()

    @property
    def is_expired(self) -> bool:
        return datetime.now(UTC) >= self.expires_at

    @property
    def is_valid(self) -> bool:
        return not self.is_revoked and not self.is_expired
