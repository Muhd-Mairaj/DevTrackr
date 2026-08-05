from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.routes.github import _consume_and_link_pending
from app.core.security import ACCESS_TOKEN_COOKIE_NAME, create_access_token
from app.crud.user import create_oauth_user
from app.models.integration import Integration, OAuth2Token

TOKEN: OAuth2Token = {
    "access_token": "token",
    "token_type": "bearer",
    "refresh_token": None,
    "expires_at": None,
}


async def _authed(client: AsyncClient, db: AsyncSession) -> None:
    user = await create_oauth_user(
        session=db, email="octo@example.com", username="octocat"
    )
    client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, create_access_token(user.id))


async def test_install_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/integrations/github/install")
    assert resp.status_code == 401


async def test_install_redirects_with_state(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    resp = await client.get("/api/integrations/github/install")
    assert resp.status_code == 302
    location = resp.headers["location"]
    assert location.startswith("https://github.com/apps/")
    assert "state=" in location


async def test_install_states_are_distinct(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    first = (await client.get("/api/integrations/github/install")).headers["location"]
    second = (await client.get("/api/integrations/github/install")).headers["location"]
    assert first != second


async def test_setup_callback_state_mismatch_rejected(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    await client.get("/api/integrations/github/install")
    resp = await client.get(
        "/api/integrations/github/setup-callback?installation_id=42&state=wrong"
    )
    assert resp.status_code == 401


async def test_setup_callback_not_logged_in_stashes_and_redirects(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    await client.get("/api/integrations/github/install")
    # Drop only the auth cookie; the signed session cookie (states list) must
    # survive so the state check runs.
    client.cookies.delete(ACCESS_TOKEN_COOKIE_NAME)
    resp = await client.get(
        "/api/integrations/github/setup-callback?installation_id=42"
    )
    assert resp.status_code == 302
    location = resp.headers["location"]
    assert "/auth/github/authorize?state=" in location


async def test_setup_callback_logged_in_with_token_links_immediately(
    client: AsyncClient, db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    # The integration must belong to the same user whose cookie is set,
    # otherwise setup-callback routes through OAuth instead of linking.
    user = await create_oauth_user(
        session=db, email="octo@example.com", username="octocat"
    )
    integration = Integration(
        provider="github",
        account_id="99",
        account_email="octo@example.com",
        access_token="gho_placeholder",
        user_id=user.id,
    )
    db.add(integration)
    await db.commit()
    client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, create_access_token(user.id))
    await client.get("/api/integrations/github/install")

    calls: dict[str, object] = {}

    async def fake_link(**kwargs: object) -> None:
        calls.update(kwargs)

    monkeypatch.setattr(
        "app.api.routes.integrations.github.link_installation", fake_link
    )
    resp = await client.get(
        "/api/integrations/github/setup-callback?installation_id=99"
    )
    assert resp.status_code == 302
    assert "?github_app=success" in resp.headers["location"]
    assert calls["installation_id"] == "99"
    assert calls["user_id"] == user.id


class FakeProfile:
    def __init__(self, url: str) -> None:
        self.url = url
        self.headers: dict[str, str] = {}

    def raise_for_status(self) -> None:
        pass

    def json(self) -> object:
        if self.url == "user":
            return {"id": 1, "login": "octocat", "email": "octo@example.com"}
        if self.url == "user/emails":
            return [{"email": "octo@example.com", "primary": True, "verified": True}]
        if self.url == "user/installations":
            return {
                "installations": [
                    {
                        "id": 42,
                        "account": {"login": "octocat", "id": "1", "type": "User"},
                        "suspended_at": None,
                    }
                ]
            }
        # user/repos* pages
        return []


class FakeOAuthSession:
    async def authorize_access_token(self, request: object) -> dict[str, object]:
        return {
            "access_token": "gho_test",
            "refresh_token": None,
        }

    async def get(
        self,
        url: str,
        token: object | None = None,
        params: object | None = None,
    ) -> FakeProfile:
        return FakeProfile(url)


class FakeOAuth:
    github = FakeOAuthSession()


async def test_callback_links_pending_installation(
    client: AsyncClient, db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    import app.api.routes.github as auth_routes
    from app.crud.github_installation import get_installations_by_user
    from app.crud.user import get_user_by_email

    monkeypatch.setattr(auth_routes, "github_oauth", FakeOAuth())
    # get_github_user and link_installation run in app.integrations.github,
    # where github_oauth is the module global; patch it there too so the real
    # functions hit the fake instead of the network.
    monkeypatch.setattr("app.integrations.github.github_oauth", FakeOAuth())

    # Seed the session: auth cookie + install state, then go anonymous so
    # setup-callback stashes instead of linking.
    await _authed(client, db)
    await client.get("/api/integrations/github/install")
    client.cookies.delete(ACCESS_TOKEN_COOKIE_NAME)
    setup = await client.get(
        "/api/integrations/github/setup-callback?installation_id=42"
    )
    assert setup.status_code == 302
    nonce = setup.headers["location"].split("state=")[1]

    # Complete the OAuth hop with the mocked client. The fake profile email
    # matches the user created by _authed, so the callback reuses it.
    resp = await client.get(f"/api/auth/github/callback?state={nonce}&code=x")
    assert resp.status_code == 302
    assert "?github_app=success" in resp.headers["location"]

    user = await get_user_by_email(session=db, email="octo@example.com")
    assert user is not None
    linked = await get_installations_by_user(session=db, user_id=user.id)
    assert len(linked) == 1
    assert linked[0].installation_id == "42"


async def test_callback_direct_install_links_with_success_redirect(
    client: AsyncClient, db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    import app.api.routes.github as auth_routes
    from app.crud.github_installation import get_installations_by_user
    from app.crud.user import get_user_by_email

    monkeypatch.setattr(auth_routes, "github_oauth", FakeOAuth())
    monkeypatch.setattr("app.integrations.github.github_oauth", FakeOAuth())

    # Direct install from github.com: no POST /install, so no install state.
    # Setup-callback stashes, then routes through OAuth.
    setup = await client.get(
        "/api/integrations/github/setup-callback?installation_id=42"
    )
    assert setup.status_code == 302
    nonce = setup.headers["location"].split("state=")[1]

    resp = await client.get(f"/api/auth/github/callback?state={nonce}&code=x")
    assert resp.status_code == 302
    assert "?github_app=success" in resp.headers["location"]

    user = await get_user_by_email(session=db, email="octo@example.com")
    assert user is not None
    linked = await get_installations_by_user(session=db, user_id=user.id)
    assert len(linked) == 1
    assert linked[0].installation_id == "42"


async def test_callback_plain_login_redirects_without_outcome(
    client: AsyncClient, db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    import app.api.routes.github as auth_routes

    monkeypatch.setattr(auth_routes, "github_oauth", FakeOAuth())
    monkeypatch.setattr("app.integrations.github.github_oauth", FakeOAuth())

    # A plain login has no state, so nothing is consumed: the redirect goes
    # back without a github_app outcome, and no installation is linked.
    resp = await client.get("/api/auth/github/callback?code=x")
    assert resp.status_code == 302
    assert "?github_app=" not in resp.headers["location"]

    from app.crud.github_installation import get_installations_by_user
    from app.crud.user import get_user_by_email

    user = await get_user_by_email(session=db, email="octo@example.com")
    assert user is not None
    linked = await get_installations_by_user(session=db, user_id=user.id)
    assert linked == []


class _FakeRequest:
    def __init__(self, session: dict[str, object]) -> None:
        self.session = session
        self.query_params = {"state": "n1"}


class _FakeUser:
    id = 1


async def test_consume_pending_expired() -> None:
    session = {
        "pending_gh_installations": {
            "n1": {
                "installation_id": "42",
                "expires_at": (datetime.now(UTC) - timedelta(minutes=1)).isoformat(),
            }
        }
    }
    outcome, consumed = await _consume_and_link_pending(
        request=_FakeRequest(session),  # type: ignore[arg-type]
        session=object(),  # type: ignore[arg-type]
        token=TOKEN,
        user=object(),  # type: ignore[arg-type]
    )
    assert outcome == "expired"
    assert consumed is True
    assert session["pending_gh_installations"] == {}


async def test_consume_pending_links_and_consumes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.api.routes.github as auth_routes

    calls: dict[str, object] = {}

    async def fake_link(**kwargs: object) -> None:
        calls.update(kwargs)

    monkeypatch.setattr(auth_routes, "link_installation", fake_link)
    session = {
        "pending_gh_installations": {
            "n1": {
                "installation_id": "42",
                "expires_at": (datetime.now(UTC) + timedelta(minutes=5)).isoformat(),
            }
        }
    }
    outcome, consumed = await _consume_and_link_pending(
        request=_FakeRequest(session),  # type: ignore[arg-type]
        session=object(),  # type: ignore[arg-type]
        token=TOKEN,
        user=_FakeUser(),  # type: ignore[arg-type]
    )
    assert outcome is None
    assert consumed is True
    assert calls["installation_id"] == "42"
    assert session["pending_gh_installations"] == {}
