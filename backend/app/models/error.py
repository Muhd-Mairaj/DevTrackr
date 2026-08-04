from sqlmodel import SQLModel


class ErrorDetail(SQLModel):
    """Body shape of a raised HTTPException: {"detail": "..."}."""

    detail: str
