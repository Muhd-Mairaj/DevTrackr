import logging

from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.api.main import api_router

# Import settings to ensure it's loaded or fails fast if config is missing/invalid
from app.core.config import settings  # noqa: F401

# Surface app-level logs: uvicorn doesn't attach a root handler, so without this
# our logger.info(...) calls would be swallowed (only WARNING+ would show).
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="DevTrackr API")

# SessionMiddleware is required by authlib's Starlette integration
# it stores the OAuth "state" (CSRF nonce) during the authorize - callback flow.
# Prevents CSRF attacks
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    https_only=settings.ENVIRONMENT in ("production", "staging"),
)

app.include_router(api_router, prefix=settings.API_STR)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to DevTrackr!"}
