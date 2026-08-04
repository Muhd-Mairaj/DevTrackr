from collections.abc import Sequence

from fastapi import APIRouter, status

from app.api.deps import GithubSynced, SessionDep
from app.api.responses import error_responses
from app.crud.repository import get_repositories_by_user
from app.models.repository import Repository, RepositoryPublic

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.get(
    "/",
    response_model=list[RepositoryPublic],
    responses=error_responses(
        status.HTTP_401_UNAUTHORIZED, status.HTTP_428_PRECONDITION_REQUIRED
    ),
)
async def get_repositories_route(
    session: SessionDep, github: GithubSynced
) -> Sequence[Repository]:
    return await get_repositories_by_user(session=session, user_id=github.user_id)
