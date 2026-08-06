import uuid
from typing import Any

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.crud.pagination import fetch_page
from app.models.base import PaginatedResponse
from app.models.time_entry import TimeEntry, TimeEntryCreate, TimeEntryUpdate


async def create_time_entry(
    *, session: AsyncSession, time_entry_in: TimeEntryCreate, project_id: uuid.UUID
) -> TimeEntry:
    if (
        time_entry_in.start_time
        and time_entry_in.end_time
        and time_entry_in.duration_seconds is None
    ):
        time_entry_in.duration_seconds = int(
            (time_entry_in.end_time - time_entry_in.start_time).total_seconds()
        )
    db_obj = TimeEntry.model_validate(time_entry_in, update={"project_id": project_id})
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_time_entry_for_project(
    *, session: AsyncSession, id: uuid.UUID, project_id: uuid.UUID
) -> TimeEntry | None:
    statement = select(TimeEntry).where(
        TimeEntry.id == id, TimeEntry.project_id == project_id
    )
    result = await session.exec(statement)
    return result.one_or_none()


async def get_time_entry(*, session: AsyncSession, id: uuid.UUID) -> TimeEntry | None:
    return await session.get(TimeEntry, id)


async def get_time_entries_by_project(
    *, session: AsyncSession, project_id: uuid.UUID, skip: int, limit: int
) -> PaginatedResponse[TimeEntry]:
    statement = (
        select(TimeEntry)
        .where(TimeEntry.project_id == project_id)
        .order_by(col(TimeEntry.start_time).desc(), col(TimeEntry.id))
    )
    return await fetch_page(
        session=session, statement=statement, skip=skip, limit=limit
    )


async def update_time_entry(
    *,
    session: AsyncSession,
    db_obj: TimeEntry,
    time_entry_in: TimeEntryUpdate | dict[str, Any],
) -> TimeEntry:
    if isinstance(time_entry_in, dict):
        update_data = time_entry_in
    else:
        update_data = time_entry_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    # Calculate duration if both start and end times are present
    # and duration is not explicitly provided
    if "start_time" in update_data or "end_time" in update_data:
        if (
            db_obj.start_time
            and db_obj.end_time
            and "duration_seconds" not in update_data
        ):
            db_obj.duration_seconds = int(
                (db_obj.end_time - db_obj.start_time).total_seconds()
            )

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def delete_time_entry(*, session: AsyncSession, db_obj: TimeEntry) -> None:
    await session.delete(db_obj)
    await session.commit()
