"""GitHub OAuth login routes.

Handles the OAuth login flow (``/authorize`` -> ``/callback``). App installation
and integration data endpoints live in ``routes/integrations/github.py``. The
flows, the ``state`` CSRF model, and the ``GET /user/installations`` IDOR check
are documented in ``docs/github-oauth-and-app-install.md``.
"""

import logging
from typing import cast

from authlib.integrations.starlette_client import OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.responses import error_responses
from app.core.config import settings
from app.core.security import create_access_token, set_auth_cookies
from app.crud.auth import create_session
from app.crud.integration import (
    create_integration,
    update_integration,
)
from app.crud.user import create_oauth_user, get_user_by_email
from app.db.session import get_db
from app.integrations.github import (
    GithubError,
    get_github_user,
    github_oauth,
    link_installation,
)
from app.models.integration import (
    Integration,
    IntegrationCreate,
    IntegrationUpdate,
)
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/github", tags=["auth"])


@router.get("/authorize")
async def github_authorize(request: Request) -> RedirectResponse:
    """Redirect the user to GitHub's OAuth consent page for login."""
    redirect_uri = f"{settings.FRONTEND_HOST}{settings.API_STR}/auth/github/callback"
    return cast(
        RedirectResponse,
        await github_oauth.github.authorize_redirect(request, redirect_uri),
    )


@router.get(
    "/callback",
    name="github_callback",
    responses=error_responses(
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    ),
)
async def github_callback(
    request: Request,
    session: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    try:
        token = await github_oauth.github.authorize_access_token(request)
    except OAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"GitHub OAuth error: {exc.description}",
        ) from exc

    try:
        github_user = await get_github_user(token)
    except GithubError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"GitHub API error: {exc}",
        ) from exc

    github_id = github_user["id"]
    github_email = github_user["email"]
    github_username = github_user["login"]

    if not github_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve a verified email from GitHub",
        )

    # Find or create the GitHub integration
    result = await session.exec(
        select(Integration).where(
            Integration.provider == "github",
            Integration.account_id == github_id,
        )
    )
    existing_integration = result.first()

    if existing_integration:
        user = await session.get(User, existing_integration.user_id)
        # Refresh the stored token so it stays current.
        await update_integration(
            session=session,
            db_obj=existing_integration,
            integration_in=IntegrationUpdate(
                access_token=token["access_token"],
                refresh_token=token.get("refresh_token"),
                account_email=github_email,
            ),
        )
    else:
        # check if a User with this email exists
        user = await get_user_by_email(session=session, email=github_email)
        if user is None:
            user = await create_oauth_user(
                session=session, email=github_email, username=github_username
            )

        # Create the GitHub integration
        await create_integration(
            session=session,
            integration_in=IntegrationCreate(
                provider="github",
                access_token=token["access_token"],
                refresh_token=token.get("refresh_token"),
                account_id=github_id,
                account_email=github_email,
            ),
            user_id=user.id,
        )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    access_token_jwt = create_access_token(user.id)
    refresh_token = await create_session(
        session=session,
        user_id=user.id,
        device_name=request.headers.get("user-agent"),
    )

    # Link any installation stashed by /setup-callback before login.
    redirect_url = settings.FRONTEND_HOST
    pending_installation_id = request.session.pop("pending_gh_installation", None)
    if pending_installation_id:
        outcome = await link_installation(
            session=session,
            token=token,
            installation_id=pending_installation_id,
            user_id=user.id,
        )
        if outcome:
            logger.warning(
                "Pending installation link for user_id=%s did not complete: %s",
                user.id,
                outcome,
            )
        redirect_url = f"{settings.FRONTEND_HOST}?github_app={outcome or 'success'}"

    response = RedirectResponse(url=redirect_url, status_code=302)
    set_auth_cookies(response, access_token_jwt, refresh_token)
    return response
