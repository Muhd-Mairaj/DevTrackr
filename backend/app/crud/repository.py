import uuid
from collections.abc import Sequence
from typing import Any

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.repository import Repository, RepositoryCreate, RepositoryUpdate


async def create_repository(
    *, session: AsyncSession, repo_in: RepositoryCreate, project_id: uuid.UUID
) -> Repository:
    db_obj = Repository.model_validate(repo_in, update={"project_id": project_id})
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_repository(*, session: AsyncSession, id: uuid.UUID) -> Repository | None:
    return await session.get(Repository, id)


async def get_repositories_by_project(
    *, session: AsyncSession, project_id: uuid.UUID
) -> Sequence[Repository]:
    statement = select(Repository).where(Repository.project_id == project_id)
    result = await session.exec(statement)
    return result.all()


async def update_repository(
    *,
    session: AsyncSession,
    db_obj: Repository,
    repo_in: RepositoryUpdate | dict[str, Any],
) -> Repository:
    if isinstance(repo_in, dict):
        update_data = repo_in
    else:
        update_data = repo_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def delete_repository(
    *, session: AsyncSession, id: uuid.UUID
) -> Repository | None:
    db_obj = await session.get(Repository, id)
    if db_obj:
        await session.delete(db_obj)
        await session.commit()
    return db_obj
