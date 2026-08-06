from typing import Any

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.project import Project


async def get_column_config(*, project: Project) -> list[dict[str, Any]] | None:
    return project.column_config


async def set_column_config(
    *, session: AsyncSession, project: Project, items: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    project.column_config = items
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project.column_config or []
