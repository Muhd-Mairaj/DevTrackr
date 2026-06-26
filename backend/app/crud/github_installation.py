import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.github_installation import GitHubInstallation


async def get_installation_by_installation_id(
    *, session: AsyncSession, installation_id: str
) -> GitHubInstallation | None:
    statement = select(GitHubInstallation).where(
        GitHubInstallation.installation_id == installation_id
    )
    result = await session.exec(statement)
    return result.first()


async def get_installations_by_user(
    *, session: AsyncSession, user_id: uuid.UUID
) -> Sequence[GitHubInstallation]:
    statement = select(GitHubInstallation).where(GitHubInstallation.user_id == user_id)
    result = await session.exec(statement)
    return result.all()


async def upsert_installation(
    *,
    session: AsyncSession,
    installation_id: str,
    account_login: str,
    account_id: str,
    account_type: str,
    user_id: uuid.UUID,
    suspended_at: datetime | None = None,
) -> GitHubInstallation:
    """Create the installation, or update it if it already exists."""
    db_obj = await get_installation_by_installation_id(
        session=session, installation_id=installation_id
    )
    if db_obj is None:
        db_obj = GitHubInstallation(installation_id=installation_id)

    db_obj.account_login = account_login
    db_obj.account_id = account_id
    db_obj.account_type = account_type
    db_obj.suspended_at = suspended_at
    db_obj.user_id = user_id

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def delete_installation(
    *, session: AsyncSession, installation_id: str
) -> GitHubInstallation | None:
    db_obj = await get_installation_by_installation_id(
        session=session, installation_id=installation_id
    )
    if db_obj:
        await session.delete(db_obj)
        await session.commit()
    return db_obj
