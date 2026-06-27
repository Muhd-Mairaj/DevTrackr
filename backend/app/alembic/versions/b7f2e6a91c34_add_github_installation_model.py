"""add github installation model

Revision ID: b7f2e6a91c34
Revises: c63043689179
Create Date: 2026-06-25 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7f2e6a91c34"
down_revision: str | Sequence[str] | None = "c63043689179"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "github_installation",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "installation_id",
            sqlmodel.sql.sqltypes.AutoString(length=64),
            nullable=False,
        ),
        sa.Column(
            "account_login",
            sqlmodel.sql.sqltypes.AutoString(length=255),
            nullable=False,
        ),
        sa.Column(
            "account_id", sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False
        ),
        sa.Column(
            "account_type", sqlmodel.sql.sqltypes.AutoString(length=32), nullable=False
        ),
        sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_github_installation_installation_id"),
        "github_installation",
        ["installation_id"],
        unique=True,
    )
    op.create_index(
        op.f("ix_github_installation_account_id"),
        "github_installation",
        ["account_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_github_installation_user_id"),
        "github_installation",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_github_installation_user_id"), table_name="github_installation"
    )
    op.drop_index(
        op.f("ix_github_installation_account_id"), table_name="github_installation"
    )
    op.drop_index(
        op.f("ix_github_installation_installation_id"),
        table_name="github_installation",
    )
    op.drop_table("github_installation")
