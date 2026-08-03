import uuid

from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, text
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.user import User


def test_migrations_up_to_date() -> None:
    """Verify that the database schema is fully in sync with SQLModel definitions."""
    # Ensure all models are imported so SQLModel.metadata is fully populated
    from app.models.auth import UserSessionToken  # noqa: F401
    from app.models.commit import Commit  # noqa: F401
    from app.models.integration import Integration  # noqa: F401
    from app.models.logbook import Logbook  # noqa: F401
    from app.models.project import Project  # noqa: F401
    from app.models.repository import Repository  # noqa: F401
    from app.models.time_entry import TimeEntry  # noqa: F401
    from app.models.user import User  # noqa: F401

    # Use the sync-capable driver to inspect the schema
    sync_url = str(settings.TEST_DATABASE_URL)
    engine = create_engine(sync_url)

    with engine.connect() as conn:
        # Configure MigrationContext with SQLModel metadata
        context = MigrationContext.configure(
            conn, opts={"target_metadata": SQLModel.metadata}
        )

        # Compare current database state with the metadata definitions
        diff = compare_metadata(context, SQLModel.metadata)

    assert diff == [], f"Detected schema differences not captured in migrations: {diff}"


async def test_database_connection(db: AsyncSession) -> None:
    """Verify that the test database is accessible and responsive."""
    result = await db.execute(text("SELECT 1"))
    assert result.scalar() == 1


async def test_transaction_rollback(db: AsyncSession) -> None:
    """Verify that data created in this test is visible during the test."""
    # Insert a unique test user
    test_email = f"test-{uuid.uuid4()}@example.com"
    test_user = User(email=test_email, username="testuser", hashed_password="fake")
    db.add(test_user)
    await db.commit()

    # Confirm persistence within the current transaction scope
    result = await db.execute(
        text("SELECT count(*) FROM users WHERE email = :email"), {"email": test_email}
    )
    assert result.scalar() == 1


async def test_transaction_rollback_is_isolated(db: AsyncSession) -> None:
    """Each test gets a clean slate — verify no users from other tests exist."""
    result = await db.execute(text("SELECT count(*) FROM users"))
    assert result.scalar() == 0
