import uuid
from collections.abc import Sequence
from typing import Any

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.logbook import Logbook, LogbookCreate, LogbookUpdate


async def create_logbook(
    *, session: AsyncSession, logbook_in: LogbookCreate, project_id: uuid.UUID
) -> Logbook:
    db_obj = Logbook.model_validate(logbook_in, update={"project_id": project_id})
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_logbook(*, session: AsyncSession, id: uuid.UUID) -> Logbook | None:
    return await session.get(Logbook, id)


async def get_logbooks_by_project(
    *, session: AsyncSession, project_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> Sequence[Logbook]:
    statement = (
        select(Logbook)
        .where(Logbook.project_id == project_id)
        .offset(skip)
        .limit(limit)
    )
    result = await session.exec(statement)
    return result.all()


async def update_logbook(
    *,
    session: AsyncSession,
    db_obj: Logbook,
    logbook_in: LogbookUpdate | dict[str, Any],
) -> Logbook:
    if isinstance(logbook_in, dict):
        update_data = logbook_in
    else:
        update_data = logbook_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def delete_logbook(*, session: AsyncSession, id: uuid.UUID) -> Logbook | None:
    db_obj = await session.get(Logbook, id)
    if db_obj:
        await session.delete(db_obj)
        await session.commit()
    return db_obj
