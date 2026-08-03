import time
import uuid
from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import (
    ACCESS_TOKEN_COOKIE_NAME,
    decode_token,
)
from app.crud.github_installation import get_installations_by_user
from app.crud.integration import get_integration_by_provider
from app.db.session import get_db
from app.models.base import TokenPayload
from app.models.integration import Integration
from app.models.user import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_STR}/auth/login", auto_error=False
)


async def get_current_user(
    session: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str | None, Depends(reusable_oauth2)] = None,
    access_token: Annotated[str | None, Cookie(alias=ACCESS_TOKEN_COOKIE_NAME)] = None,
) -> User:
    # Prioritize cookie, fallback to header
    auth_token = access_token or token

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_token(auth_token)
        # Ensure it's an access token
        if payload.get("type") != "access":
            raise jwt.PyJWTError("Not an access token")

        token_data = TokenPayload(**payload)
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    # In token_data.sub we store user ID
    if not token_data.sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user"
        )
    return user


async def get_current_user_optional(
    session: Annotated[AsyncSession, Depends(get_db)],
    access_token: Annotated[str | None, Cookie(alias=ACCESS_TOKEN_COOKIE_NAME)] = None,
) -> User | None:
    if not access_token:
        return None

    try:
        payload = decode_token(access_token)
        if payload.get("type") != "access":
            return None
        token_data = TokenPayload(**payload)
        if not token_data.sub:
            return None
        user_id = uuid.UUID(token_data.sub)
    except (jwt.PyJWTError, ValueError):
        return None

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


async def get_github_jwt_token() -> str:
    # Get PEM file path
    pem = settings.GITHUB_PRIVATE_KEY_PATH

    # Get the Client ID
    client_id = settings.GITHUB_CLIENT_ID

    # Open PEM
    with open(pem, "rb") as pem_file:
        signing_key = pem_file.read()

    # https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app#about-json-web-tokens-jwts
    payload = {
        "iat": int(time.time() - 60),
        "exp": int(time.time()) + 600,
        "iss": client_id,
    }

    # Create JWT
    encoded_jwt = jwt.encode(payload, signing_key, algorithm="RS256")

    return encoded_jwt


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalCurrentUser = Annotated[User | None, Depends(get_current_user_optional)]
GithubJWT = Annotated[str, Depends(get_github_jwt_token)]
SessionDep = Annotated[AsyncSession, Depends(get_db)]


async def get_github_integration(session: SessionDep, user: CurrentUser) -> Integration:
    # Gates on the user's linked GitHub account (OAuth integration).
    integration = await get_integration_by_provider(
        session=session, user_id=user.id, provider="github"
    )
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="GitHub integration not found for this user",
        )
    return integration


GithubIntegration = Annotated[Integration, Depends(get_github_integration)]


async def get_github_synced(
    integration: GithubIntegration, session: SessionDep
) -> Integration:
    # The app installation is what triggers the repo sync, so an account
    # without one yields nothing. Both missing requisites fail with 428;
    # running after GithubIntegration decides which detail message surfaces.
    installations = await get_installations_by_user(
        session=session, user_id=integration.user_id
    )
    if not installations:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail="GitHub app not installed",
        )
    return integration


GithubSynced = Annotated[Integration, Depends(get_github_synced)]
