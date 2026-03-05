from fastapi import FastAPI

from app.api.main import api_router

# Import settings to ensure it's loaded or fails fast if config is missing/invalid
from app.core.config import settings  # noqa: F401

app = FastAPI(title="DevTrackr API")

app.include_router(api_router, prefix=settings.API_STR)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to DevTrackr!"}
