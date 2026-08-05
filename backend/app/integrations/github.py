"""GitHub API integration layer.

Mirrors ``crud/`` for external calls: pure functions taking keyword args, no
FastAPI imports, unit-testable without HTTP. OAuth login routes live in
``app/api/routes/github.py``; app-install routes in
``app/api/routes/integrations/github.py``. Security model documented in
``docs/github-oauth-and-app-install.md``.
"""

import logging
import secrets
from datetime import datetime
from typing import Any
from uuid import UUID

from authlib.integrations.starlette_client import OAuth
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.crud.github_installation import (
    get_installation_by_installation_id,
    upsert_installation,
)
from app.crud.repository import upsert_repository
from app.models.integration import OAuth2Token

logger = logging.getLogger(__name__)


class GithubError(Exception):
    """A GitHub API call failed."""


github_oauth = OAuth()
github_oauth.register(
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


def new_install_state() -> str:
    """Return a fresh CSRF state for the app-install flow."""
    return secrets.token_urlsafe(32)


def _next_link(link_header: str | None) -> str | None:
    """Return the next-page URL from a GitHub Link header, if any."""
    if not link_header:
        return None
    for part in link_header.split(","):
        url, _, rel = part.partition(";")
        if 'rel="next"' in rel:
            return url.strip().strip("<>")
    return None


async def get_github_user(token: OAuth2Token) -> dict[str, str]:
    """Fetch the GitHub profile for ``token``.

    Falls back to ``/user/emails`` when the profile has no public email. The
    returned dict has keys ``id`` (str), ``login`` (str) and ``email`` (str,
    possibly empty when GitHub has no verified email). Raises ``GithubError``
    on API failure only.
    """
    try:
        resp = await github_oauth.github.get("user", token=token)
        resp.raise_for_status()
        github_user = resp.json()
    except Exception as exc:
        raise GithubError("Failed to fetch GitHub user") from exc

    github_email = github_user.get("email") or ""
    if not github_email:
        try:
            emails = await github_oauth.github.get("user/emails", token=token)
            emails.raise_for_status()
            primary = next(
                (e for e in emails.json() if e.get("primary") and e.get("verified")),
                None,
            )
            if primary:
                github_email = primary["email"]
        except Exception as exc:
            raise GithubError("Failed to fetch GitHub emails") from exc

    return {
        "id": str(github_user["id"]),
        "login": github_user.get("login", ""),
        "email": github_email,
    }


async def get_user_installations(token: OAuth2Token) -> list[dict[str, Any]]:
    """List the installations the token's user can see.

    Raises ``GithubError`` on API failure. The callback's ``installation_id``
    is never trusted on its own; callers confirm membership here (IDOR gate,
    see docs/github-oauth-and-app-install.md).
    """
    try:
        resp = await github_oauth.github.get(
            "user/installations", token=token, params={"per_page": 100}
        )
        resp.raise_for_status()
    except Exception as exc:
        raise GithubError("Failed to fetch user installations") from exc
    installations: list[dict[str, Any]] = resp.json().get("installations", [])
    return installations


async def sync_github_repositories(
    *,
    session: AsyncSession,
    token: OAuth2Token,
    user_id: UUID,
) -> str | None:
    """Upsert the user's GitHub repos into ``Repository`` rows.

    Runs after an installation link so the repo selector can serve synced
    rows from the DB. Returns ``None`` when every repo was synced, or a
    non-``None`` outcome code that the caller can pass through to the
    frontend.

    Never raises: every failure path is logged and surfaced through the
    return value so the installation link always completes.
    """
    synced = 0
    errors = 0
    try:
        next_url: str | None = "user/repos?per_page=100"
        while next_url:
            try:
                resp = await github_oauth.github.get(next_url, token=token)
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


async def link_installation(
    *,
    session: AsyncSession,
    token: OAuth2Token,
    installation_id: str,
    user_id: UUID,
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
        installations = await get_user_installations(token)
    except GithubError:
        logger.exception(
            "GET /user/installations failed for installation_id=%s", installation_id
        )
        return "error"

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
    account_type = account.get("type")
    if account_type not in ("User", "Organization"):
        logger.warning(
            "Unexpected account type %r for installation_id=%s, not linking",
            account_type,
            installation_id,
        )
        return "error"
    suspended_raw = matched.get("suspended_at")
    try:
        suspended_at = datetime.fromisoformat(suspended_raw) if suspended_raw else None
        await upsert_installation(
            session=session,
            installation_id=str(installation_id),
            account_login=account.get("login", ""),
            account_id=str(account.get("id", "")),
            account_type=account_type,
            suspended_at=suspended_at,
            user_id=user_id,
        )
    except Exception:
        logger.exception(
            "Failed to persist installation_id=%s for user_id=%s",
            installation_id,
            user_id,
        )
        return "error"
    # Populate Repository rows so the selector serves synced repos from the DB.
    sync_outcome = await sync_github_repositories(
        session=session, token=token, user_id=user_id
    )
    logger.info(
        "Linked installation_id=%s (account=%s) to user_id=%s",
        installation_id,
        account.get("login", ""),
        user_id,
    )
    return sync_outcome
