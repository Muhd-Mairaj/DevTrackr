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
    """Upgrade schema: add user ownership to Repository.

    user_id is backfilled from the project owner via the projectrepository
    link table.  Rows with no linked project (not produced by the previous
    migration, but handled defensively) are dropped before the NOT NULL
    constraint is applied so the migration never fails on existing data.
    """
    # 1. Add user_id as nullable; backfill from the project owner through
    #    the link table created in the previous migration.
    op.add_column("repository", sa.Column("user_id", sa.Uuid(), nullable=True))
    op.execute(
        "UPDATE repository SET user_id = sq.user_id FROM ("
        "  SELECT DISTINCT r.id AS repo_id, p.user_id "
        "  FROM repository r "
        "  JOIN projectrepository pr ON r.id = pr.repository_id "
        "  JOIN project p ON pr.project_id = p.id"
        ") AS sq "
        "WHERE repository.id = sq.repo_id"
    )

    # 2. Any repository that still has no user_id was never linked to a
    #    project.  Without an owner the row cannot satisfy the new model
    #    constraints, so drop it.
    op.execute("DELETE FROM repository WHERE user_id IS NULL")
    op.alter_column("repository", "user_id", nullable=False)

    # 3. Replace the old unique-on-github_id index with a composite unique
    #    on (github_id, user_id) and add the FK to users.
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
    """Downgrade schema: drop user ownership columns and constraints."""
    op.drop_constraint("repository_user_id_fkey", "repository", type_="foreignkey")
    op.drop_constraint("uq_repository_github_id_user_id", "repository", type_="unique")
    op.drop_index(op.f("ix_repository_github_id"), table_name="repository")
    op.create_index(
        op.f("ix_repository_github_id"), "repository", ["github_id"], unique=True
    )
    op.drop_column("repository", "user_id")
