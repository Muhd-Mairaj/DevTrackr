from api.v1.routes import router as api_router
from fastapi import FastAPI

app = FastAPI(title="DevTrackr API")

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Welcome to DevTrackr!"}
