from fastapi import APIRouter

from app.api.routes import auth, github, integrations, projects, repositories, utils

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(github.router)
api_router.include_router(integrations.github.router)
api_router.include_router(projects.router)
api_router.include_router(repositories.router)
api_router.include_router(utils.router)
