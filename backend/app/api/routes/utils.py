from fastapi import APIRouter, status

router = APIRouter(tags=["utils"])


@router.get("/ping", status_code=status.HTTP_200_OK)
def ping() -> dict[str, str]:
    return {"status": "ok"}
