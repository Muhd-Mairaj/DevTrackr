"""GitHub OAuth login routes.

Handles the OAuth login flow (``/authorize`` -> ``/callback``). App installation
and integration data endpoints live in ``routes/integrations/github.py``. The
flows, the ``state`` CSRF model, and the ``GET /user/installations`` IDOR check
are documented in ``docs/github-oauth-and-app-install.md``.
"""

import logging
import uuid
from datetime import datetime
from typing import cast

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, set_auth_cookies
from app.crud.auth import create_session
from app.crud.github_installation import (
    get_installation_by_installation_id,
    upsert_installation,
)
from app.crud.integration import (
    create_integration,
    update_integration,
)
from app.crud.repository import upsert_repository
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


def _next_link(link_header: str | None) -> str | None:
    """Return the next-page URL from a GitHub Link header, if any."""
    if not link_header:
        return None
    for part in link_header.split(","):
        url, _, rel = part.partition(";")
        if 'rel="next"' in rel:
            return url.strip().strip("<>")
    return None


async def _sync_github_repositories(
    *,
    session: AsyncSession,
    token: OAuth2Token,
    user_id: uuid.UUID,
) -> str | None:
    """Upsert the user's GitHub repos into ``Repository`` rows.

    Runs after an installation link so the repo selector can serve synced
    rows from the DB.  Returns ``None`` when every repo was synced, or a
    non-``None`` outcome code that the caller can pass through to the
    frontend redirect.

    Never raises: every failure path is logged and surfaced through the
    return value so the installation link always completes.
    """
    synced = 0
    errors = 0
    try:
        next_url: str | None = "user/repos?per_page=100"
        while next_url:
            try:
                resp = await oauth.github.get(next_url, token=token)
                resp.raise_for_status()
            except Exception:
                logger.exception(
                    "GitHub repo sync page fetch failed for user_id=%s at %s",
                    user_id,
                    next_url,
                )
                return "sync_error"

            for repo in resp.json():
                try:
                    await upsert_repository(
                        session=session,
                        user_id=user_id,
                        github_id=repo["id"],
                        full_name=repo["full_name"],
                        repo_name=repo["name"],
                        url=repo.get("html_url"),
                        description=repo.get("description"),
                        commit=False,
                    )
                    synced += 1
                except Exception:
                    logger.exception(
                        "Failed to upsert repo github_id=%s for user_id=%s",
                        repo.get("id"),
                        user_id,
                    )
                    errors += 1
            await session.commit()
            next_url = _next_link(resp.headers.get("Link"))
    except Exception:
        logger.exception("GitHub repo sync failed for user_id=%s", user_id)
        return "sync_error"

    if errors:
        logger.warning(
            "GitHub repo sync for user_id=%s: %s synced, %s errors",
            user_id,
            synced,
            errors,
        )
    if errors and synced == 0:
        return "sync_error"
    return "sync_partial" if errors else None


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
    # Populate Repository rows so the selector serves synced repos from the DB.
    # Runs after a successful link on every install path (setup-callback and
    # the pending-install OAuth callback).
    sync_outcome = await _sync_github_repositories(
        session=session, token=token, user_id=user_id
    )
    logger.info(
        "Linked installation_id=%s (account=%s) to user_id=%s",
        installation_id,
        account.get("login", ""),
        user_id,
    )
    return sync_outcome  # None on clean sync, outcome code otherwise
