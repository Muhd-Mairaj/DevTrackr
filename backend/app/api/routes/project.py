import logging
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, SessionDep
from app.crud.project import (
    create_project,
    delete_project,
    get_project,
    get_projects_by_user,
    update_project,
)
from app.models.project import ProjectCreate, ProjectPublic, ProjectUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=list[ProjectPublic])
async def get_projects_route(session: SessionDep, user: CurrentUser) -> Any:
    return await get_projects_by_user(session=session, user_id=user.id)


@router.get("/{id}", response_model=ProjectPublic)
async def get_project_route(session: SessionDep, id: uuid.UUID) -> Any:
    project = await get_project(session=session, id=id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    return project


@router.post("/", response_model=ProjectPublic, status_code=201)
async def create_project_route(
    session: SessionDep, project_in: ProjectCreate, user: CurrentUser
) -> Any:
    return await create_project(session=session, project_in=project_in, user_id=user.id)


@router.patch("/{id}", response_model=ProjectPublic)
async def update_project_route(
    session: SessionDep,
    id: uuid.UUID,
    project_in: ProjectUpdate,
    user: CurrentUser,
) -> Any:
    project = await get_project(session=session, id=id)

    if not project or project.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    return await update_project(session=session, db_obj=project, project_in=project_in)


@router.delete("/{id}", response_model=ProjectPublic)
async def delete_project_route(
    session: SessionDep, id: uuid.UUID, user: CurrentUser
) -> Any:
    project = await get_project(session=session, id=id)

    if not project or project.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    await delete_project(session=session, db_obj=project)
    return project
