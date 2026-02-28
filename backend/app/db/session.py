from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.ENVIRONMENT == "local",  # Log SQL queries in local environment
)

# Use AsyncSession with sessionmaker
# expire_on_commit=False is critical for Async to prevent "DetachedInstanceError"
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


# Dependency for FastAPI Routes
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
