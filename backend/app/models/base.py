import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import event as sa_event
from sqlmodel import DateTime, Field, SQLModel


class BaseModel(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        nullable=False,
    )
    deleted_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore[call-overload]
        nullable=True,
    )


class TokenPayload(SQLModel):
    sub: str | None = None
    exp: int | None = None
    type: str | None = None
    jti: str | None = None


# Column-level onupdate only fires when an UPDATE is emitted for the row;
# relationship-only changes (e.g. a project's repositories) never touch the
# parent row, so stamp updated_at from the mapper event instead. propagate
# attaches this to every table model that inherits BaseModel.
@sa_event.listens_for(BaseModel, "before_update", propagate=True)
def _touch_updated_at(_mapper: Any, _connection: Any, target: Any) -> None:
    target.updated_at = datetime.now(UTC)
