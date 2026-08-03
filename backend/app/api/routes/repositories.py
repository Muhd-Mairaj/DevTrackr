import logging
import uuid
from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentUser, SessionDep
from app.crud.repository import get_repositories_by_user, get_repository_for_user
from app.models.repository import Repository, RepositoryPublic

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/repositories", tags=["repositories"])


async def get_owned_repository(
    session: SessionDep, id: uuid.UUID, user: CurrentUser
) -> Repository:
    repository = await get_repository_for_user(session=session, id=id, user_id=user.id)
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found"
        )
    return repository


OwnedRepository = Annotated[Repository, Depends(get_owned_repository)]


@router.get("/", response_model=list[RepositoryPublic])
async def get_repositories_route(
    session: SessionDep, user: CurrentUser
) -> Sequence[Repository]:
    return await get_repositories_by_user(session=session, user_id=user.id)
