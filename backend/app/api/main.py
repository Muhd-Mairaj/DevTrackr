from fastapi import APIRouter

from app.api.routes import auth, github, projects, repositories, utils
from app.api.routes.integrations import github as github_integrations

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(github.router)
api_router.include_router(github_integrations.router)
api_router.include_router(projects.router)
api_router.include_router(repositories.router)
api_router.include_router(utils.router)
