"""GitHub OAuth routes using authlib.

Flow:
  1. GET  /auth/github/authorize  → redirects the browser to GitHub's consent page
  2. GET  /auth/github/callback   → GitHub redirects here with a code; we exchange
     it for an access token, fetch the user's profile, create or find the local
     User + Integration records, set a JWT session cookie, and redirect to the
     frontend.

authlib's Starlette integration stores the OAuth "state" (CSRF nonce) in
Starlette's SessionMiddleware cookie automatically.
"""

import uuid
from typing import Any, cast

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import CurrentUser
from app.core.config import settings
from app.core.security import (
    create_access_token,
    set_auth_cookies,
)
from app.crud.auth import create_session
from app.crud.integration import create_integration, get_integration_by_provider
from app.crud.user import create_user, get_user_by_email
from app.db.session import get_db
from app.models.integration import Integration, IntegrationCreate
from app.models.user import User, UserCreate

router = APIRouter(prefix="/auth/github", tags=["auth"])


oauth = OAuth()


oauth.register(
    name="github",
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    access_token_url="https://github.com/login/oauth/access_token",
    access_token_params=None,
    authorize_url="https://github.com/login/oauth/authorize",
    authorize_params=None,
    api_base_url="https://api.github.com/",
    client_kwargs={
        "scope": "user:email read:user",
        "code_challenge_method": "S256",
    },
)


@router.get("/authorize")
async def github_authorize(request: Request) -> RedirectResponse:
    """Redirect the user to GitHub's OAuth consent page."""
    redirect_uri = f"{settings.FRONTEND_HOST}{settings.API_STR}/auth/github/callback"
    return cast(
        RedirectResponse, await oauth.github.authorize_redirect(request, redirect_uri)
    )


@router.get("/callback", name="github_callback")
async def github_callback(
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    try:
        token = await oauth.github.authorize_access_token(request)
    except OAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"GitHub OAuth error: {exc.description}",
        ) from exc

    # Fetch GitHub user profile
    resp = await oauth.github.get("user", token=token)
    github_user = resp.json()

    github_id = str(github_user["id"])
    github_email = github_user.get("email") or ""
    github_username = github_user.get("login", "")

    # If GitHub profile doesn't have a public email, fetch from /user/emails
    if not github_email:
        emails_resp = await oauth.github.get("user/emails", token=token)
        emails = emails_resp.json()
        primary = next(
            (e for e in emails if e.get("primary") and e.get("verified")), None
        )
        if primary:
            github_email = primary["email"]

    if not github_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve a verified email from GitHub",
        )

    # check if we already have an integration with this GitHub account
    result_integration = await session.exec(
        select(Integration).where(
            Integration.provider == "github",
            Integration.account_id == github_id,
        )
    )
    existing_integration = result_integration.first()

    if existing_integration:
        # fetch the linked user
        user = await session.get(User, existing_integration.user_id)
    else:
        # check if a User with this email exists
        user = await get_user_by_email(session=session, email=github_email)

        if user is None:
            # New user
            user_create = UserCreate(
                email=github_email, username=github_username, password=str(uuid.uuid4())
            )
            user = await create_user(session=session, user_create=user_create)
            # Nullify hashed_password just in case it should be null for OAuth-only
            user.hashed_password = None
            session.add(user)
            await session.commit()
            await session.refresh(user)

        # Create the GitHub Integration record
        integration_in = IntegrationCreate(
            provider="github",
            access_token=token["access_token"],
            refresh_token=token.get("refresh_token"),
            account_id=github_id,
            account_email=github_email,
        )
        await create_integration(
            session=session, integration_in=integration_in, user_id=user.id
        )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    access_token = create_access_token(user.id)
    # Create a stateful DB session (Refresh Token)
    refresh_token = await create_session(
        session=session,
        user_id=user.id,
        device_name=request.headers.get("user-agent"),
    )

    response = RedirectResponse(url=settings.FRONTEND_HOST, status_code=302)

    set_auth_cookies(response, access_token, refresh_token)

    return response


# example for later, adapted from docs
@router.get("/repositories")
async def get_github_repositories(
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    integration = await get_integration_by_provider(
        session=session, user_id=current_user.id, provider="github"
    )

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub integration not found for this user",
        )

    # Fetch GitHub repositories using the stored token
    resp = await oauth.github.get("user/repos", token=integration.to_token())
    resp.raise_for_status()

    return cast(list[dict[str, Any]], resp.json())
