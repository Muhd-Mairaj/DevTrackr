import asyncio
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.main import app

TEST_DATABASE_URL = str(settings.TEST_DATABASE_URL)


@pytest.fixture(scope="session")
async def engine() -> AsyncGenerator[AsyncEngine]:
    """Create a session-scoped AsyncEngine and ensure it is disposed of at teardown."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db(engine: AsyncEngine) -> AsyncGenerator[None]:
    # Models must be imported before create_all to populate SQLModel metadata
    from app.models.auth import UserSessionToken  # noqa: F401
    from app.models.commit import Commit  # noqa: F401
    from app.models.integration import Integration  # noqa: F401
    from app.models.logbook import Logbook  # noqa: F401
    from app.models.project import Project  # noqa: F401
    from app.models.repository import Repository  # noqa: F401
    from app.models.time_entry import TimeEntry  # noqa: F401
    from app.models.user import User  # noqa: F401

    # Clean the database first to ensure migrations run from scratch
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        from sqlalchemy import text

        await conn.execute(text("DROP TABLE IF EXISTS alembic_version"))

    def upgrade_db() -> None:
        import os

        from alembic.command import upgrade
        from alembic.config import Config

        alembic_cfg = Config("alembic.ini")
        base_dir = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        alembic_cfg.set_main_option(
            "script_location", os.path.join(base_dir, "app/alembic")
        )
        alembic_cfg.set_main_option("sqlalchemy.url", str(settings.TEST_DATABASE_URL))
        upgrade(alembic_cfg, "head")

    try:
        # upgrade_db runs sync Alembic operations; must be offloaded from the async loop
        await asyncio.to_thread(upgrade_db)
    except Exception:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
        raise

    yield

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture
async def db(engine: AsyncEngine) -> AsyncGenerator[AsyncSession]:
    # Use a nested transaction (savepoint) to support test-level commits
    # while guaranteeing isolation via rollback.
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async with AsyncSession(connection, expire_on_commit=False) as session:
            await connection.begin_nested()  # savepoint
            try:
                yield session
            finally:
                await connection.rollback()  # always safe
        await transaction.rollback()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient]:
    async def _get_test_db() -> AsyncGenerator[AsyncSession]:
        yield db

    app.dependency_overrides[get_db] = _get_test_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac
    finally:
        app.dependency_overrides.pop(get_db, None)
