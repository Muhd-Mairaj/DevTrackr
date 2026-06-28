"""GitHub OAuth login and App installation routes.

Two flows: OAuth login (``/authorize`` -> ``/callback``) and App installation
(``/install`` -> ``/setup-callback``). The flows, the ``state`` CSRF model, and
the ``GET /user/installations`` IDOR check are documented in
``docs/github-oauth-and-app-install.md``.
"""

import logging
import secrets
import uuid
from datetime import datetime
from typing import Any, cast

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import CurrentUser, OptionalCurrentUser
from app.core.config import settings
from app.core.security import create_access_token, set_auth_cookies
from app.crud.auth import create_session
from app.crud.github_installation import (
    get_installation_by_installation_id,
    upsert_installation,
)
from app.crud.integration import (
    create_integration,
    get_integration_by_provider,
    update_integration,
)
from app.crud.user import create_oauth_user, get_user_by_email
from app.db.session import get_db
from app.models.integration import (
    Integration,
    IntegrationCreate,
    IntegrationUpdate,
    OAuth2Token,
)
from app.models.user import User

logger = logging.getLogger(__name__)

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
    """Redirect the user to GitHub's OAuth consent page for login."""
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

    # Resolve GitHub profile
    github_user = (await oauth.github.get("user", token=token)).json()
    github_id = str(github_user["id"])
    github_email = github_user.get("email") or ""
    github_username = github_user.get("login", "")

    # Fall back to /user/emails when the profile has no public email.
    if not github_email:
        emails = (await oauth.github.get("user/emails", token=token)).json()
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
        outcome = await _link_installation(
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


@router.get("/install")
async def github_install(
    request: Request, current_user: CurrentUser
) -> RedirectResponse:
    """Start a GitHub App installation (login required).

    Sets a CSRF ``state`` in the session so ``/setup-callback`` can verify the
    redirect came from us. See ``docs/github-oauth-and-app-install.md``.
    """
    state = secrets.token_urlsafe(32)
    request.session["gh_install_state"] = state
    install_url = (
        f"https://github.com/apps/{settings.GITHUB_APP_SLUG}/installations/new"
        f"?state={state}"
    )
    logger.info(
        "User %s starting GitHub App install (state=%s...)", current_user.id, state[:8]
    )
    return RedirectResponse(install_url, status_code=302)


@router.get("/setup-callback")
async def github_setup_callback(
    request: Request,
    user: OptionalCurrentUser,
    session: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Handle the GitHub App Setup URL redirect after installation.

    Links the installation when possible, otherwise stashes it and routes
    through OAuth. See ``docs/github-oauth-and-app-install.md`` for the full
    scenario table and security model.
    """
    installation_id = request.query_params.get("installation_id")
    if not installation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing installation_id in setup callback",
        )

    # Validate state to prevent CSRF attacks
    callback_state = request.query_params.get("state")
    expected_state = request.session.pop("gh_install_state", None)
    if expected_state is not None:
        if callback_state != expected_state:
            logger.warning(
                "Setup callback state mismatch (possible CSRF) for installation_id=%s",
                installation_id,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid state for GitHub App installation",
            )
    else:
        # No state set -> direct GitHub install or admin-approval flow.
        logger.info(
            "Setup callback without prior state for installation_id=%s", installation_id
        )

    # Stash the installation_id for OAuth redirect.
    request.session["pending_gh_installation"] = installation_id

    oauth_login_url = (
        f"{settings.FRONTEND_HOST}{settings.API_STR}/auth/github/authorize"
    )

    if user is None:
        logger.info(
            "Not logged in for installation_id=%s; redirecting to OAuth",
            installation_id,
        )
        return RedirectResponse(oauth_login_url, status_code=302)

    # Logged in but no GitHub token yet -> get one via OAuth, then link.
    integration = await get_integration_by_provider(
        session=session, user_id=user.id, provider="github"
    )
    if not integration:
        logger.info(
            "User %s has no GitHub integration; redirecting to OAuth for "
            "installation_id=%s",
            user.id,
            installation_id,
        )
        return RedirectResponse(oauth_login_url, status_code=302)

    # Have a GitHub token -> link now and clear the pending stash.
    outcome = await _link_installation(
        session=session,
        token=integration.to_token(),
        installation_id=installation_id,
        user_id=user.id,
    )
    request.session.pop("pending_gh_installation", None)

    redirect_url = f"{settings.FRONTEND_HOST}?github_app={outcome or 'success'}"
    return RedirectResponse(redirect_url, status_code=302)


async def _link_installation(
    *,
    session: AsyncSession,
    token: OAuth2Token,
    installation_id: str,
    user_id: uuid.UUID,
) -> str | None:
    """Verify an ``installation_id`` belongs to this user, then upsert it.

    Authorization uses the user's OWN token, never the App JWT (which can read
    any installation). Returns ``None`` on success or an outcome code
    (``"unauthorized"``, ``"conflict"``, ``"error"``); never raises, since it
    runs inside login/redirect flows that must complete regardless. See
    ``docs/github-oauth-and-app-install.md``.
    """
    logger.info("Linking installation_id=%s for user_id=%s", installation_id, user_id)

    try:
        resp = await oauth.github.get(
            "user/installations", token=token, params={"per_page": 100}
        )
        resp.raise_for_status()
    except Exception:
        logger.exception(
            "GET /user/installations failed for installation_id=%s", installation_id
        )
        return "error"

    installations = resp.json().get("installations", [])
    matched = next(
        (i for i in installations if str(i.get("id")) == str(installation_id)), None
    )
    if matched is None:
        logger.warning(
            "installation_id=%s not among user_id=%s installations -> unauthorized",
            installation_id,
            user_id,
        )
        return "unauthorized"

    # Don't silently rebind an installation owned by another user.
    existing = await get_installation_by_installation_id(
        session=session, installation_id=str(installation_id)
    )
    if existing and existing.user_id and existing.user_id != user_id:
        logger.warning(
            "installation_id=%s already linked to user_id=%s -> conflict",
            installation_id,
            existing.user_id,
        )
        return "conflict"

    account = matched.get("account") or {}
    suspended_raw = matched.get("suspended_at")
    await upsert_installation(
        session=session,
        installation_id=str(installation_id),
        account_login=account.get("login", ""),
        account_id=str(account.get("id", "")),
        account_type=account.get("type", ""),
        suspended_at=datetime.fromisoformat(suspended_raw) if suspended_raw else None,
        user_id=user_id,
    )
    logger.info(
        "Linked installation_id=%s (account=%s) to user_id=%s",
        installation_id,
        account.get("login", ""),
        user_id,
    )
    return None


@router.get("/repositories")
async def get_github_repositories(
    current_user: CurrentUser,
    session: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """List repositories accessible to the current user's GitHub integration."""
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
