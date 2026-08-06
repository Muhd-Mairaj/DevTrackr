"""add column_config to project

Revision ID: e000be71c5ac
Revises: 4090e70dafc6
Create Date: 2026-08-06 20:25:48.291207

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = "e000be71c5ac"
down_revision: str | Sequence[str] | None = "4090e70dafc6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("project", sa.Column("column_config", JSONB(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("project", "column_config")
