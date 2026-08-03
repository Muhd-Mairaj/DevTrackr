import uuid
from collections.abc import Sequence
from typing import Any, cast

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.project_repository import ProjectRepository
from app.models.repository import Repository, RepositoryCreate, RepositoryUpdate


async def create_repository(
    *, session: AsyncSession, repo_in: RepositoryCreate, user_id: uuid.UUID
) -> Repository:
    db_obj = Repository.model_validate(repo_in, update={"user_id": user_id})
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_repository(*, session: AsyncSession, id: uuid.UUID) -> Repository | None:
    return await session.get(Repository, id)


async def get_repository_for_user(
    *, session: AsyncSession, id: uuid.UUID, user_id: uuid.UUID
) -> Repository | None:
    # a repo that is not owned by the current user must not resolve.
    statement = select(Repository).where(
        Repository.id == id, Repository.user_id == user_id
    )
    result = await session.exec(statement)
    return result.one_or_none()


async def upsert_repository(
    *,
    session: AsyncSession,
    user_id: uuid.UUID,
    github_id: int,
    full_name: str,
    repo_name: str,
    url: str | None = None,
    description: str | None = None,
) -> Repository:
    # Install-time sync entry point: one call per repo from the GitHub API
    # response. Creates the row on first sync, refreshes metadata (and
    # reactivates a soft-deleted row) on later syncs.
    statement = select(Repository).where(
        Repository.github_id == github_id, Repository.user_id == user_id
    )
    db_obj = (await session.exec(statement)).one_or_none()
    if db_obj is None:
        db_obj = Repository(
            user_id=user_id,
            github_id=github_id,
            full_name=full_name,
            repo_name=repo_name,
            url=url,
            description=description,
        )
        session.add(db_obj)
    else:
        db_obj.full_name = full_name
        db_obj.repo_name = repo_name
        db_obj.url = url
        db_obj.description = description
        db_obj.is_active = True
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_repositories_by_user(
    *, session: AsyncSession, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> Sequence[Repository]:
    statement = (
        select(Repository)
        .where(Repository.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(statement)
    return result.all()


async def get_repositories_by_github_ids(
    *, session: AsyncSession, github_ids: Sequence[int], user_id: uuid.UUID
) -> Sequence[Repository]:
    if not github_ids:
        return []
    github_id_col = cast(Any, Repository.github_id)
    statement = select(Repository).where(
        github_id_col.in_(github_ids), Repository.user_id == user_id
    )
    result = await session.exec(statement)
    return result.all()


async def get_repositories_by_project(
    *, session: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> Sequence[Repository]:
    # Only repos linked to THIS project and linked to this user
    statement = select(Repository).where(
        select(ProjectRepository.repository_id)
        .where(
            ProjectRepository.repository_id == Repository.id,
            ProjectRepository.project_id == project_id,
        )
        .exists(),
        Repository.user_id == user_id,
    )
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
