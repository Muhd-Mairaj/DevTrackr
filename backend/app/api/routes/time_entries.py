import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import SessionDep
from app.api.routes.projects import OwnedProject
from app.crud.time_entry import (
    create_time_entry,
    delete_time_entry,
    get_time_entries_by_project,
    get_time_entry_for_project,
    update_time_entry,
)
from app.models.base import PaginatedResponse
from app.models.time_entry import (
    TimeEntry,
    TimeEntryCreate,
    TimeEntryPublic,
    TimeEntryUpdate,
)

router = APIRouter(prefix="/projects", tags=["entries"])


@router.get("/{id}/entries", response_model=PaginatedResponse[TimeEntryPublic])
async def get_entries_for_project_route(
    session: SessionDep,
    project: OwnedProject,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=25, ge=1, le=100),
) -> PaginatedResponse[TimeEntry]:
    return await get_time_entries_by_project(
        session=session, project_id=project.id, skip=skip, limit=limit
    )


@router.post("/{id}/entries", response_model=TimeEntryPublic, status_code=201)
async def create_time_entry_route(
    session: SessionDep, time_entry_in: TimeEntryCreate, project: OwnedProject
) -> TimeEntry:
    return await create_time_entry(
        session=session, time_entry_in=time_entry_in, project_id=project.id
    )


@router.get("/{id}/entries/{entry_id}", response_model=TimeEntryPublic)
async def get_time_entry_route(
    session: SessionDep, entry_id: uuid.UUID, project: OwnedProject
) -> TimeEntry | None:
    return await get_time_entry_for_project(
        session=session, id=entry_id, project_id=project.id
    )


@router.patch("/{id}/entries/{entry_id}", response_model=TimeEntryPublic)
async def update_time_entry_route(
    session: SessionDep,
    entry_id: uuid.UUID,
    time_entry_in: TimeEntryUpdate,
    project: OwnedProject,
) -> TimeEntry:
    db_obj = await get_time_entry_for_project(
        session=session, id=entry_id, project_id=project.id
    )
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )

    return await update_time_entry(
        session=session, db_obj=db_obj, time_entry_in=time_entry_in
    )


@router.delete("/{id}/entries/{entry_id}", response_model=TimeEntryPublic)
async def delete_time_entry_route(
    session: SessionDep, entry_id: uuid.UUID, project: OwnedProject
) -> Any:
    entry = await get_time_entry_for_project(
        session=session, id=entry_id, project_id=project.id
    )
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found"
        )
    await delete_time_entry(session=session, db_obj=entry)
    return entry
