import uuid
from typing import Any

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User, UserCreate, UserUpdate


async def create_user(*, session: AsyncSession, user_create: UserCreate) -> User:
    db_obj = User(
        email=user_create.email,
        username=user_create.username,
        hashed_password=hash_password(user_create.password),
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def authenticate(
    *, session: AsyncSession, email: str, password: str
) -> User | None:
    statement = select(User).where(User.email == email)
    result = await session.exec(statement)
    user = result.first()
    if not user:
        return None
    if not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_user_by_email(*, session: AsyncSession, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    result = await session.exec(statement)
    return result.first()


async def get_user_by_username(*, session: AsyncSession, username: str) -> User | None:
    statement = select(User).where(User.username == username)
    result = await session.exec(statement)
    return result.first()


async def get_user(*, session: AsyncSession, id: uuid.UUID) -> User | None:
    return await session.get(User, id)


async def update_user(
    *, session: AsyncSession, db_obj: User, user_in: UserUpdate | dict[str, Any]
) -> User:
    if isinstance(user_in, dict):
        update_data = user_in
    else:
        update_data = user_in.model_dump(exclude_unset=True)

    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            update_data["hashed_password"] = hash_password(password)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj
