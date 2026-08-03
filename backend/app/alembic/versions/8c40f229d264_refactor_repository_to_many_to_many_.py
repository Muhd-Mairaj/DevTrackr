"""refactor_repository_to_many_to_many_with_projects

Revision ID: 8c40f229d264
Revises: b7f2e6a91c34
Create Date: 2026-08-03 18:53:02.102195

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8c40f229d264"
down_revision: str | Sequence[str] | None = "b7f2e6a91c34"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema: refactor Repository from 1:1 project FK to M2M link table.

    Preserves existing rows and their project relationships:
    1. Create the link table and copy every (project_id, id) pair into it.
    2. Add github_id, full_name, description — github_id and full_name are
       backfilled with placeholders (0 and repo_name) for pre-sync rows;
       the first GitHub sync run updates them to real values.
    3. Drop the old project_id FK and column.
    """
    # 1. Create the project<->repository link table.
    op.create_table(
        "projectrepository",
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("repository_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["project.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["repository_id"], ["repository.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("project_id", "repository_id"),
    )

    # 2. Migrate existing 1:1 relationships into the link table.
    op.execute(
        "INSERT INTO projectrepository (project_id, repository_id) "
        "SELECT project_id, id FROM repository"
    )

    # 3. Add the new GitHub-metadata columns as nullable, backfill, then
    #    tighten.  github_id = 0 and full_name = repo_name are sentinel
    #    placeholders for rows that predate the GitHub sync; the next
    #    install-time sync replaces them with real values.
    op.add_column("repository", sa.Column("github_id", sa.Integer(), nullable=True))
    op.add_column(
        "repository",
        sa.Column("full_name", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.add_column(
        "repository",
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.execute("UPDATE repository SET github_id = 0 WHERE github_id IS NULL")
    op.execute("UPDATE repository SET full_name = repo_name WHERE full_name IS NULL")
    op.alter_column("repository", "github_id", nullable=False)
    op.alter_column("repository", "full_name", nullable=False)

    # 4. Indexes on the new columns.
    op.create_index(
        op.f("ix_repository_full_name"), "repository", ["full_name"], unique=False
    )
    op.create_index(
        op.f("ix_repository_github_id"), "repository", ["github_id"], unique=True
    )

    # 5. Drop the old project-scoped FK and column; the link table now holds
    #    every relationship.
    op.drop_constraint(
        op.f("repository_project_id_fkey"), "repository", type_="foreignkey"
    )
    op.drop_column("repository", "project_id")


def downgrade() -> None:
    """Downgrade schema: restore the 1:1 project FK, dropping the link table.

    Only the FIRST linked project is restored per repository; extra links
    (from the M2M era) are silently dropped.  This is lossy by design.
    """
    op.add_column(
        "repository",
        sa.Column("project_id", sa.UUID(), autoincrement=False, nullable=True),
    )
    op.execute(
        "UPDATE repository SET project_id = ("
        "  SELECT project_id FROM projectrepository "
        "  WHERE projectrepository.repository_id = repository.id "
        "  LIMIT 1"
        ")"
    )
    # Repositories that were never linked to any project (possible in the
    # M2M model) cannot exist with the old NOT NULL constraint; drop them.
    op.execute("DELETE FROM repository WHERE project_id IS NULL")
    op.alter_column("repository", "project_id", nullable=False)
    op.create_foreign_key(
        op.f("repository_project_id_fkey"),
        "repository",
        "project",
        ["project_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_index(op.f("ix_repository_github_id"), table_name="repository")
    op.drop_index(op.f("ix_repository_full_name"), table_name="repository")
    op.drop_column("repository", "description")
    op.drop_column("repository", "full_name")
    op.drop_column("repository", "github_id")
    op.drop_table("projectrepository")
