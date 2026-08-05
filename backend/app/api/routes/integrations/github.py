"""GitHub App installation and integration data routes.

These endpoints manage GitHub integration (installation flow and data access),
separate from the OAuth login flow in ``routes/github.py``.
"""

import logging
import secrets
from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import CurrentUser, OptionalCurrentUser, SessionDep
from app.api.responses import error_responses
from app.api.routes.github import _link_installation
from app.core.config import settings
from app.crud.github_installation import get_installations_by_user
from app.crud.integration import get_integration_by_provider
from app.db.session import get_db
from app.models.github_installation import GitHubInstallation, GithubInstallationPublic
from app.models.integration import GithubStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations/github", tags=["integrations"])


@router.get(
    "/status",
    response_model=GithubStatus,
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
)
async def github_status(session: SessionDep, user: CurrentUser) -> GithubStatus:
    """Report the user's GitHub setup state for the frontend prompts."""
    integration = await get_integration_by_provider(
        session=session, user_id=user.id, provider="github"
    )
    installations = await get_installations_by_user(session=session, user_id=user.id)
    return GithubStatus(
        account_linked=integration is not None,
        app_installed=bool(installations),
    )


@router.get(
    "/installations",
    response_model=list[GithubInstallationPublic],
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
)
async def github_installations(
    session: SessionDep, user: CurrentUser
) -> Sequence[GitHubInstallation]:
    """List the user's GitHub App installations for the settings page."""
    return await get_installations_by_user(session=session, user_id=user.id)


@router.get(
    "/install",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
)
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


@router.get(
    "/setup-callback",
    responses=error_responses(
        status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED
    ),
)
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
