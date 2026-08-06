import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel as PydanticBaseModel
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


# The column-level onupdate parameter only fires for column mutations, so
# relationship-only changes (e.g. assigning project.repositories) leave
# updated_at stale.  A mapper before_update event catches those cases.
# See https://docs.sqlalchemy.org/en/20/orm/events.html#sqlalchemy.orm.MapperEvents.before_update
@sa_event.listens_for(BaseModel, "before_update", propagate=True)
def _touch_updated_at(_mapper: Any, _connection: Any, target: Any) -> None:
    target.updated_at = datetime.now(UTC)


class TokenPayload(SQLModel):
    sub: str | None = None
    exp: int | None = None
    type: str | None = None
    jti: str | None = None


# Plain pydantic, not SQLModel: SQLModel's metaclass does not substitute the
# type parameter when FastAPI emits OpenAPI, so items would be typed unknown
# in the generated client. The envelope never touches the database, so
# SQLModel's table machinery is not needed here.
class PaginatedResponse[T](PydanticBaseModel):
    items: list[T]
    total: int
    skip: int
    limit: int
