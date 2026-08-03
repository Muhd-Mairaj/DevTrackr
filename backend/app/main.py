import logging

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.sessions import SessionMiddleware

from app.api.main import api_router

# Import settings to ensure it's loaded or fails fast if config is missing/invalid
from app.core.config import settings  # noqa: F401

# Surface app-level logs: uvicorn doesn't attach a root handler, so without this
# our logger.info(...) calls would be swallowed (only WARNING+ would show).
logging.basicConfig(level=logging.INFO)


def use_custom_unique_id_function(route: APIRoute) -> str:
    return route.name.removesuffix("_route")


app = FastAPI(
    title="DevTrackr API",
    generate_unique_id_function=use_custom_unique_id_function,
)

# SessionMiddleware stores the OAuth "state" (CSRF nonce) during the
# authorize-callback flow. Prevents CSRF attacks
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    https_only=settings.ENVIRONMENT in ("production", "staging"),
)

app.include_router(api_router, prefix=settings.API_STR)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to DevTrackr!"}
