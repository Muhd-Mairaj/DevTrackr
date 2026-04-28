import asyncio
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.main import app

TEST_DATABASE_URL = str(settings.TEST_DATABASE_URL)

engine: AsyncEngine = create_async_engine(TEST_DATABASE_URL, echo=False)

TestingSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)  # type: ignore


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db() -> AsyncGenerator[None]:
    # Models must be imported before create_all to populate SQLModel metadata
    from app.models.auth import UserSessionToken  # noqa: F401
    from app.models.commit import Commit  # noqa: F401
    from app.models.integration import Integration  # noqa: F401
    from app.models.logbook import Logbook  # noqa: F401
    from app.models.project import Project  # noqa: F401
    from app.models.repository import Repository  # noqa: F401
    from app.models.time_entry import TimeEntry  # noqa: F401
    from app.models.user import User  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    def stamp_db() -> None:
        import os

        from alembic.config import Config
        from alembic.script import ScriptDirectory
        from sqlalchemy import create_engine, text

        alembic_cfg = Config("alembic.ini")
        base_dir = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        alembic_cfg.set_main_option(
            "script_location", os.path.join(base_dir, "app/alembic")
        )
        alembic_cfg.set_main_option("sqlalchemy.url", str(settings.TEST_DATABASE_URL))

        sync_engine = create_engine(str(settings.TEST_DATABASE_URL))
        with sync_engine.connect() as conn:
            conn.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS alembic_version"
                    " (version_num VARCHAR(32) NOT NULL)"
                )
            )
            head = ScriptDirectory.from_config(alembic_cfg).get_current_head()
            conn.execute(text("DELETE FROM alembic_version"))
            conn.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:head)"),
                {"head": head},
            )
            conn.commit()

    # stamp_db runs sync Alembic operations; must be offloaded from the async loop
    await asyncio.to_thread(stamp_db)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession]:
    # Nested transaction ensures each test gets a clean slate via rollback
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async with AsyncSession(connection, expire_on_commit=False) as session:
            yield session
        await transaction.rollback()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient]:
    async def _get_test_db() -> AsyncGenerator[AsyncSession]:
        yield db

    app.dependency_overrides[get_db] = _get_test_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
