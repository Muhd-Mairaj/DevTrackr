import uuid
from collections.abc import Sequence
from typing import Any

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.project import Project, ProjectCreate, ProjectUpdate


async def create_project(
    *, session: AsyncSession, project_in: ProjectCreate, user_id: uuid.UUID
) -> Project:
    db_obj = Project.model_validate(project_in, update={"user_id": user_id})
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_project(*, session: AsyncSession, id: uuid.UUID) -> Project | None:
    return await session.get(Project, id)


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
        update_data = project_in
    else:
        update_data = project_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def delete_project(*, session: AsyncSession, db_obj: Project) -> None:
    await session.delete(db_obj)
    await session.commit()
