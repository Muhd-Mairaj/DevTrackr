from typing import Any

from fastapi import status

from app.models.error import ErrorDetail

# Shared descriptions so every operation documents its error bodies without
# repeating the text. Any code added to a route's responses dict must be
# listed here.
_ERROR_DESCRIPTIONS: dict[int, str] = {
    status.HTTP_400_BAD_REQUEST: "Invalid request",
    status.HTTP_401_UNAUTHORIZED: "Authentication required",
    status.HTTP_403_FORBIDDEN: "Insufficient permissions",
    status.HTTP_404_NOT_FOUND: "Resource not found",
    status.HTTP_409_CONFLICT: "Resource already exists",
    status.HTTP_428_PRECONDITION_REQUIRED: (
        "GitHub account not linked or app not installed"
    ),
}


def error_responses(*codes: int) -> dict[int | str, dict[str, Any]]:
    """Build a FastAPI ``responses`` dict typing each code's error body.

    Every HTTPException in the API carries a ``{"detail": str}`` body, so all
    declared error codes share the ``ErrorDetail`` schema. Keeps the generated
    client's error types concrete instead of ``unknown``.
    """
    return {
        code: {"description": _ERROR_DESCRIPTIONS[code], "model": ErrorDetail}
        for code in codes
    }
