import uuid
from datetime import UTC, datetime, timedelta

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import create_session_token
from app.models.auth import UserSessionToken


async def create_session(
    *,
    session: AsyncSession,
    user_id: uuid.UUID,
    device_name: str | None = None,
    device_type: str | None = None,
    device_fingerprint: str | None = None,
) -> UserSessionToken:
    """Create a persistent user session, generating and storing the refresh token."""
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    # Create instance; id is automatically assigned via default_factory
    db_obj = UserSessionToken(
        user_id=user_id,
        expires_at=expires_at,
        device_name=device_name,
        device_type=device_type,
        device_fingerprint=device_fingerprint,
    )

    # Generate the signed JWT using the model's auto-generated ID
    refresh_token = create_session_token(subject=db_obj.id, expires_at=expires_at)

    # Update hash and save in a single commit
    db_obj.token_hash = refresh_token
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)

    return db_obj


async def get_session_by_id(
    *, session: AsyncSession, id: uuid.UUID
) -> UserSessionToken | None:
    """Get a valid session by its UUID."""
    return await session.get(UserSessionToken, id)


async def get_session_by_token(
    *, session: AsyncSession, token: str
) -> UserSessionToken | None:
    """Look up a session in the database using the refresh token."""
    statement = select(UserSessionToken).where(
        UserSessionToken.token_hash == token,
        UserSessionToken.is_revoked == False,
    )
    result = await session.exec(statement)
    return result.first()


async def revoke_session(
    *, session: AsyncSession, db_session: UserSessionToken
) -> None:
    """Revoke a session (soft delete)."""
    db_session.is_revoked = True
    session.add(db_session)
    await session.commit()
