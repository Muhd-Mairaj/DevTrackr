from fastapi import FastAPI

from app.api.v1.routes import router as api_router

# Import settings to ensure it's loaded or fails fast if config is missing/invalid
from app.core.config import settings  # noqa: F401

app = FastAPI(title="DevTrackr API")

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to DevTrackr!"}
