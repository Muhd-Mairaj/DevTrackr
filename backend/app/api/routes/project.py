import logging
import uuid
from typing import Any

from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.crud.project import create_project, get_project, get_projects_by_user
from app.models.project import ProjectCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
async def get_projects_route(session: SessionDep, user: CurrentUser) -> Any:
    projects = await get_projects_by_user(session=session, user_id=user.id)
    print(f"{projects = }")
    return projects


@router.get("/{id}")
async def get_project_route(session: SessionDep, id: uuid.UUID) -> Any:
    project = await get_project(session=session, id=id)
    print(f"{project = }")
    return project


@router.post("/")
async def create_project_route(
    session: SessionDep, project_in: ProjectCreate, user: CurrentUser
) -> Any:
    project = await create_project(
        session=session, project_in=project_in, user_id=user.id
    )
    print(f"Created {project = }")
    return project


@router.delete("/{id}")
async def delete_project_route(session: SessionDep) -> None:
    pass
