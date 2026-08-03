import logging
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentUser, SessionDep
from app.crud.project import (
    create_project,
    delete_project,
    get_project_for_user,
    get_projects_by_user,
    update_project,
)
from app.models.project import Project, ProjectCreate, ProjectPublic, ProjectUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


async def get_owned_project(
    session: SessionDep, id: uuid.UUID, user: CurrentUser
) -> Project:
    project = await get_project_for_user(session=session, id=id, user_id=user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return project


OwnedProject = Annotated[Project, Depends(get_owned_project)]


@router.get("/", response_model=list[ProjectPublic])
async def get_projects_route(session: SessionDep, user: CurrentUser) -> Any:
    return await get_projects_by_user(session=session, user_id=user.id)


@router.get("/{id}", response_model=ProjectPublic)
async def get_project_route(project: OwnedProject) -> Any:
    return project


@router.post("/", response_model=ProjectPublic, status_code=201)
async def create_project_route(
    session: SessionDep, project_in: ProjectCreate, user: CurrentUser
) -> Any:
    return await create_project(session=session, project_in=project_in, user_id=user.id)


@router.patch("/{id}", response_model=ProjectPublic)
async def update_project_route(
    session: SessionDep,
    project_in: ProjectUpdate,
    project: OwnedProject,
) -> Any:
    return await update_project(session=session, db_obj=project, project_in=project_in)


@router.delete("/{id}", response_model=ProjectPublic)
async def delete_project_route(
    session: SessionDep,
    project: OwnedProject,
) -> Any:
    await delete_project(session=session, db_obj=project)
    return project
