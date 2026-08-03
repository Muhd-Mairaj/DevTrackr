import uuid
from collections.abc import Sequence
from typing import Any, cast

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.project_repository import ProjectRepository
from app.models.repository import Repository, RepositoryCreate, RepositoryUpdate


async def create_repository(
    *, session: AsyncSession, repo_in: RepositoryCreate
) -> Repository:
    db_obj = Repository.model_validate(repo_in)
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_repository(*, session: AsyncSession, id: uuid.UUID) -> Repository | None:
    return await session.get(Repository, id)


async def get_repositories_by_github_ids(
    *, session: AsyncSession, github_ids: Sequence[int]
) -> Sequence[Repository]:
    if not github_ids:
        return []
    github_id_col = cast(Any, Repository.github_id)
    statement = select(Repository).where(github_id_col.in_(github_ids))
    result = await session.exec(statement)
    return result.all()


async def get_repositories_by_project(
    *, session: AsyncSession, project_id: uuid.UUID
) -> Sequence[Repository]:
    # Correlated EXISTS: only repos linked to THIS project. Without the
    # Repository.id comparison the subquery is uncorrelated and matches every
    # repo whenever the project has any link at all.
    statement = select(Repository).where(
        select(ProjectRepository.repository_id)
        .where(
            ProjectRepository.repository_id == Repository.id,
            ProjectRepository.project_id == project_id,
        )
        .exists()
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
