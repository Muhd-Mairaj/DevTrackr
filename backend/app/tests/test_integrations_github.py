from typing import cast
from uuid import uuid4

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.integrations.github import (
    GithubError,
    _next_link,
    get_user_installations,
    link_installation,
    new_install_state,
    sync_github_repositories,
)
from app.models.integration import OAuth2Token

TOKEN: OAuth2Token = {
    "access_token": "token",
    "token_type": "bearer",
    "refresh_token": None,
    "expires_at": None,
}


class FakeResponse:
    def __init__(self, payload: object, status: int = 200) -> None:
        self._payload = payload
        self.status_code = status
        self.headers: dict[str, str] = {}

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise Exception(f"HTTP {self.status_code}")

    def json(self) -> object:
        return self._payload


class FakeGithub:
    def __init__(self, payload: object, status: int = 200) -> None:
        self.payload = payload
        self.status = status

    async def get(
        self,
        url: str,
        token: OAuth2Token | None = None,
        params: dict[str, int] | None = None,
    ) -> FakeResponse:
        return FakeResponse(self.payload, self.status)


def test_new_install_state_unique_urlsafe() -> None:
    a, b = new_install_state(), new_install_state()
    assert a != b
    assert len(a) == 43


def test_next_link_missing_or_last() -> None:
    assert _next_link(None) is None
    header = (
        '<https://api.github.com/user/repos?page=3>; rel="prev", '
        '<https://api.github.com/user/repos?page=4>; rel="last"'
    )
    assert _next_link(header) is None


def test_next_link_returns_next() -> None:
    header = (
        '<https://api.github.com/user/repos?page=2>; rel="next", '
        '<https://api.github.com/user/repos?page=4>; rel="last"'
    )
    assert _next_link(header) == "https://api.github.com/user/repos?page=2"


async def test_get_user_installations_returns_list(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = {"installations": [{"id": 1}]}
    monkeypatch.setattr(
        "app.integrations.github.github_oauth.github", FakeGithub(payload)
    )
    result = await get_user_installations(TOKEN)
    assert result == [{"id": 1}]


async def test_get_user_installations_raises_on_api_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.integrations.github.github_oauth.github", FakeGithub({}, status=500)
    )
    with pytest.raises(GithubError):
        await get_user_installations(TOKEN)


async def test_link_installation_success(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: dict[str, object] = {}

    async def fake_installations(_token: OAuth2Token) -> list[dict[str, object]]:
        return [
            {
                "id": 42,
                "account": {"login": "octocat", "id": "1", "type": "User"},
                "suspended_at": None,
            }
        ]

    async def fake_upsert(**kwargs: object) -> object:
        calls.update(kwargs)
        return object()

    async def fake_sync(**_kwargs: object) -> None:
        return None

    async def fake_get_installation(**_kwargs: object) -> None:
        return None

    monkeypatch.setattr(
        "app.integrations.github.get_user_installations", fake_installations
    )
    monkeypatch.setattr("app.integrations.github.upsert_installation", fake_upsert)
    monkeypatch.setattr("app.integrations.github.sync_github_repositories", fake_sync)
    monkeypatch.setattr(
        "app.integrations.github.get_installation_by_installation_id",
        fake_get_installation,
    )

    result = await link_installation(
        session=cast(AsyncSession, object()),
        token=TOKEN,
        installation_id="42",
        user_id=uuid4(),
    )
    assert result is None
    assert calls["installation_id"] == "42"
    assert calls["account_type"] == "User"


async def test_link_installation_unauthorized(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_installations(_token: OAuth2Token) -> list[dict[str, object]]:
        return [{"id": 7}]

    monkeypatch.setattr(
        "app.integrations.github.get_user_installations", fake_installations
    )

    result = await link_installation(
        session=cast(AsyncSession, object()),
        token=TOKEN,
        installation_id="42",
        user_id=uuid4(),
    )
    assert result == "unauthorized"


async def test_link_installation_conflict(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_installations(_token: OAuth2Token) -> list[dict[str, object]]:
        return [{"id": 42}]

    class Existing:
        user_id = uuid4()

    async def fake_get_installation(**_kwargs: object) -> Existing:
        return Existing()

    monkeypatch.setattr(
        "app.integrations.github.get_user_installations", fake_installations
    )
    monkeypatch.setattr(
        "app.integrations.github.get_installation_by_installation_id",
        fake_get_installation,
    )

    result = await link_installation(
        session=cast(AsyncSession, object()),
        token=TOKEN,
        installation_id="42",
        user_id=uuid4(),
    )
    assert result == "conflict"


async def test_link_installation_api_error(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_installations(_token: OAuth2Token) -> list[dict[str, object]]:
        raise GithubError("boom")

    monkeypatch.setattr(
        "app.integrations.github.get_user_installations", fake_installations
    )

    result = await link_installation(
        session=cast(AsyncSession, object()),
        token=TOKEN,
        installation_id="42",
        user_id=uuid4(),
    )
    assert result == "error"


async def test_sync_github_repositories_partial(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class PagedResponse:
        def __init__(self, payload: object, link: str | None = None) -> None:
            self._payload = payload
            self.headers: dict[str, str] = {"Link": link} if link else {}

        def raise_for_status(self) -> None:
            pass

        def json(self) -> object:
            return self._payload

    class PagedGithub:
        def __init__(self, pages: list[list[dict[str, object]]]) -> None:
            self.pages = pages

        async def get(
            self,
            url: str,
            token: OAuth2Token | None = None,
            params: dict[str, int] | None = None,
        ) -> PagedResponse:
            return (
                PagedResponse(
                    self.pages[0],
                    '<https://api.github.com/user/repos?page=2>; rel="next"',
                )
                if url == "user/repos?per_page=100"
                else PagedResponse(self.pages[1])
            )

    class FakeSession:
        def __init__(self) -> None:
            self.commits: int = 0

        async def commit(self) -> None:
            self.commits += 1

    async def fake_upsert(**kwargs: object) -> None:
        if kwargs["github_id"] == 2:
            raise Exception("db error")

    fake_session = FakeSession()
    session = cast(AsyncSession, fake_session)
    monkeypatch.setattr(
        "app.integrations.github.github_oauth.github",
        PagedGithub(
            [
                [{"id": 1, "full_name": "a/b", "name": "b"}],
                [{"id": 2, "full_name": "c/d", "name": "d"}],
            ]
        ),
    )
    monkeypatch.setattr("app.integrations.github.upsert_repository", fake_upsert)

    result = await sync_github_repositories(
        session=session, token=TOKEN, user_id=uuid4()
    )
    assert result == "sync_partial"
    assert fake_session.commits == 2
