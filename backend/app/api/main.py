from fastapi import APIRouter

from app.api.routes import auth, github, project, utils

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(github.router)
api_router.include_router(project.router)
api_router.include_router(utils.router)
