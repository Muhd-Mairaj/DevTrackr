import logging
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import CurrentUser, OptionalCurrentUser, SessionDep
from app.api.responses import error_responses
from app.core.config import settings
from app.crud.github_installation import get_installations_by_user
from app.crud.integration import get_integration_by_provider
from app.db.session import get_db
from app.integrations.github import link_installation, new_install_state
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
    """List the current user's GitHub App installations."""
    return await get_installations_by_user(session=session, user_id=user.id)


@router.get(
    "/install",
    responses=error_responses(status.HTTP_401_UNAUTHORIZED),
)
async def github_install(
    request: Request, current_user: CurrentUser
) -> RedirectResponse:
    """Start a GitHub App installation (login required).

    Sets a one-time CSRF ``state`` in the session so ``/setup-callback`` can
    verify the redirect came from us. The list keeps multiple tabs' flows
    valid. See docs/github-oauth-and-app-install.md.
    """
    state = new_install_state()
    states = request.session.get("gh_install_states", [])
    states.append(state)
    request.session["gh_install_states"] = states
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

    Links the installation when possible, otherwise stashes it keyed by the
    OAuth state nonce and routes through OAuth. See
    docs/github-oauth-and-app-install.md for the full scenario table and
    security model.
    """
    installation_id = request.query_params.get("installation_id")
    if not installation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing installation_id in setup callback",
        )

    # Validate state to prevent CSRF attacks. A state that is present must
    # match one we issued; the matching value is popped so replay fails.
    # GitHub drops state for direct installs and org-admin approvals, so a
    # missing state is expected and handled gracefully (the IDOR gate in
    # link_installation still protects the link).
    callback_state = request.query_params.get("state")
    states = request.session.get("gh_install_states", [])
    if callback_state:
        if callback_state not in states:
            logger.warning(
                "Setup callback state mismatch (possible CSRF) for installation_id=%s",
                installation_id,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid state for GitHub App installation",
            )
        states.remove(callback_state)
        request.session["gh_install_states"] = states
    else:
        logger.info(
            "Setup callback without prior state for installation_id=%s", installation_id
        )

    integration = None
    if user is not None:
        integration = await get_integration_by_provider(
            session=session, user_id=user.id, provider="github"
        )

    # Not logged in, or no GitHub token yet: stash the installation keyed by
    # the OAuth state nonce and route through OAuth so the callback can link
    # it once the user has a token.
    if user is None or integration is None:
        nonce = new_install_state()
        pending = request.session.get("pending_gh_installations", {})
        pending[nonce] = {
            "installation_id": installation_id,
            "expires_at": (datetime.now(UTC) + timedelta(minutes=15)).isoformat(),
        }
        request.session["pending_gh_installations"] = pending
        oauth_login_url = (
            f"{settings.FRONTEND_HOST}{settings.API_STR}/auth/github/authorize"
            f"?state={nonce}"
        )
        logger.info(
            "Routing installation_id=%s through OAuth (user=%s)",
            installation_id,
            user.id if user else "anonymous",
        )
        return RedirectResponse(oauth_login_url, status_code=302)

    # Have a GitHub token: link now.
    outcome = await link_installation(
        session=session,
        token=integration.to_token(),
        installation_id=installation_id,
        user_id=user.id,
    )
    redirect_url = f"{settings.FRONTEND_HOST}?github_app={outcome or 'success'}"
    return RedirectResponse(redirect_url, status_code=302)
