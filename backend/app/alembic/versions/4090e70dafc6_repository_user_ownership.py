"""repository_user_ownership

Revision ID: 4090e70dafc6
Revises: 8c40f229d264
Create Date: 2026-08-03 13:42:42.577497

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4090e70dafc6"
down_revision: str | Sequence[str] | None = "8c40f229d264"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Existing rows predate user ownership (pre-sync test data) and have no
    # owner, so drop them before user_id is made NOT NULL.
    op.execute("DELETE FROM repository")
    op.add_column("repository", sa.Column("user_id", sa.Uuid(), nullable=False))
    op.drop_index(op.f("ix_repository_github_id"), table_name="repository")
    op.create_index(
        op.f("ix_repository_github_id"), "repository", ["github_id"], unique=False
    )
    op.create_unique_constraint(
        "uq_repository_github_id_user_id", "repository", ["github_id", "user_id"]
    )
    op.create_foreign_key(
        "repository_user_id_fkey",
        "repository",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("repository_user_id_fkey", "repository", type_="foreignkey")
    op.drop_constraint("uq_repository_github_id_user_id", "repository", type_="unique")
    op.drop_index(op.f("ix_repository_github_id"), table_name="repository")
    op.create_index(
        op.f("ix_repository_github_id"), "repository", ["github_id"], unique=True
    )
    op.drop_column("repository", "user_id")
