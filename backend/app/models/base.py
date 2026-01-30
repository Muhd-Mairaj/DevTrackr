import uuid
from datetime import UTC, datetime

from sqlmodel import DateTime, Field, SQLModel


class BaseModel(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False,
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(UTC),  # Auto-update on save
        },
    )
    deleted_at: datetime | None = Field(
        default=None, 
        sa_type=DateTime(timezone=True)
    )
