import uuid
from collections.abc import Sequence
from typing import Any

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.repository import get_repositories_by_github_ids
from app.models.project import Project, ProjectCreate, ProjectUpdate


async def create_project(
    *, session: AsyncSession, project_in: ProjectCreate, user_id: uuid.UUID
) -> Project:
    db_obj = Project.model_validate(project_in, update={"user_id": user_id})
    if project_in.repository_ids:
        repos = await get_repositories_by_github_ids(
            session=session, github_ids=project_in.repository_ids
        )
        # Link every repo that already exists; missing ones are skipped (the
        # link routes upsert Repository rows before referencing them).
        db_obj.repositories = list(repos)
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj, attribute_names=["repositories"])
    return db_obj


async def get_project_for_user(
    *, session: AsyncSession, id: uuid.UUID, user_id: uuid.UUID
) -> Project | None:
    statement = select(Project).where(Project.id == id, Project.user_id == user_id)
    result = await session.exec(statement)
    return result.one_or_none()


async def get_projects_by_user(
    *, session: AsyncSession, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> Sequence[Project]:
    statement = (
        select(Project).where(Project.user_id == user_id).offset(skip).limit(limit)
    )
    result = await session.exec(statement)
    return result.all()


async def get_project_count_by_user(
    *, session: AsyncSession, user_id: uuid.UUID
) -> int:
    statement = (
        select(func.count()).select_from(Project).where(Project.user_id == user_id)
    )
    result = await session.exec(statement)
    return result.one()


async def update_project(
    *,
    session: AsyncSession,
    db_obj: Project,
    project_in: ProjectUpdate | dict[str, Any],
) -> Project:
    if isinstance(project_in, dict):
        update_data = dict(project_in)
    else:
        update_data = project_in.model_dump(exclude_unset=True)

    # Full-set replace: the payload's list becomes the project's repo set.
    # An absent field (or null) leaves links unchanged; [] clears them.
    repository_ids = update_data.pop("repository_ids", None)
    if repository_ids is not None:
        repos = await get_repositories_by_github_ids(
            session=session, github_ids=repository_ids
        )
        db_obj.repositories = list(repos)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj, attribute_names=["repositories"])
    return db_obj


async def delete_project(*, session: AsyncSession, db_obj: Project) -> None:
    await session.delete(db_obj)
    await session.commit()
