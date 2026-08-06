from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError

from app.api.deps import SessionDep
from app.api.responses import error_responses
from app.api.routes.projects import OwnedProject
from app.crud.project_column import get_column_config, set_column_config
from app.models.column_config import (
    DEFAULT_COLUMNS,
    ProjectColumnItem,
    validate_column_config,
)

router = APIRouter(prefix="/projects", tags=["columns"])


@router.get(
    "/{id}/columns",
    response_model=list[ProjectColumnItem],
    responses=error_responses(status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND),
)
async def get_columns_route(project: OwnedProject) -> list[ProjectColumnItem]:
    config = await get_column_config(project=project)
    source = config if config is not None else DEFAULT_COLUMNS
    try:
        return [ProjectColumnItem(**item) for item in source]
    except ValidationError:
        # Corrupt stored config (only possible via direct DB writes; the PUT
        # path validates) falls back to the defaults rather than 500ing.
        return [ProjectColumnItem(**item) for item in DEFAULT_COLUMNS]


@router.put(
    "/{id}/columns",
    response_model=list[ProjectColumnItem],
    responses=error_responses(
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_404_NOT_FOUND,
        status.HTTP_422_UNPROCESSABLE_CONTENT,
    ),
)
async def set_columns_route(
    session: SessionDep,
    project: OwnedProject,
    columns: list[ProjectColumnItem],
) -> list[ProjectColumnItem]:
    try:
        validate_column_config(columns)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        )
    saved = await set_column_config(
        session=session,
        project=project,
        items=[column.model_dump() for column in columns],
    )
    return [ProjectColumnItem(**item) for item in saved]
