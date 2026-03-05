import uuid
from collections.abc import Sequence
from typing import Any

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.integration import Integration, IntegrationCreate, IntegrationUpdate


async def create_integration(
    *, session: AsyncSession, integration_in: IntegrationCreate, user_id: uuid.UUID
) -> Integration:
    db_obj = Integration.model_validate(integration_in, update={"user_id": user_id})
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_integration(
    *, session: AsyncSession, id: uuid.UUID
) -> Integration | None:
    return await session.get(Integration, id)


async def get_integrations_by_user(
    *, session: AsyncSession, user_id: uuid.UUID
) -> Sequence[Integration]:
    statement = select(Integration).where(Integration.user_id == user_id)
    result = await session.exec(statement)
    return result.all()


async def get_integration_by_provider(
    *, session: AsyncSession, user_id: uuid.UUID, provider: str
) -> Integration | None:
    statement = select(Integration).where(
        Integration.user_id == user_id, Integration.provider == provider
    )
    result = await session.exec(statement)
    return result.first()


async def update_integration(
    *,
    session: AsyncSession,
    db_obj: Integration,
    integration_in: IntegrationUpdate | dict[str, Any],
) -> Integration:
    if isinstance(integration_in, dict):
        update_data = integration_in
    else:
        update_data = integration_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def delete_integration(
    *, session: AsyncSession, id: uuid.UUID
) -> Integration | None:
    db_obj = await session.get(Integration, id)
    if db_obj:
        await session.delete(db_obj)
        await session.commit()
    return db_obj
