import os
import uuid

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.user import User


def test_migrations_up_to_date() -> None:
    """Verify that the database schema is in sync with Alembic heads."""
    alembic_cfg = Config("alembic.ini")

    # Map the absolute path to migration scripts for the test environment
    base_dir = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    alembic_cfg.set_main_option(
        "script_location", os.path.join(base_dir, "app/alembic")
    )

    script = ScriptDirectory.from_config(alembic_cfg)
    head = script.get_current_head()

    # Use the async-capable driver for synchronous inspection
    sync_url = str(settings.TEST_DATABASE_URL)
    engine = create_engine(sync_url)
    with engine.connect() as conn:
        context = MigrationContext.configure(conn)
        current = context.get_current_revision()

    assert current == head, f"Database is at {current}, expected head {head}"


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


async def test_no_data_leakage_from_rollback(db: AsyncSession) -> None:
    """Verify data from test_transaction_rollback was cleaned up and not leaked."""
    result = await db.execute(
        text("SELECT count(*) FROM users WHERE email LIKE 'test-%@example.com'")
    )
    assert result.scalar() == 0
