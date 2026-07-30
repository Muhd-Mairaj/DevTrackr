import logging
from typing import Any

from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.crud.project import get_projects_by_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
async def get_projects_route(session: SessionDep, user: CurrentUser) -> Any:
    projects = await get_projects_by_user(session=session, user_id=user.id)
    print(f"{projects = }")
    return projects
