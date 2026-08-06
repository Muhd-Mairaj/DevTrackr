import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import ACCESS_TOKEN_COOKIE_NAME, create_access_token
from app.crud.user import create_oauth_user


async def _authed(
    client: AsyncClient, db: AsyncSession, email: str = "octo@example.com"
) -> uuid.UUID:
    user = await create_oauth_user(session=db, email=email, username="octocat")
    client.cookies.set(ACCESS_TOKEN_COOKIE_NAME, create_access_token(user.id))
    return user.id


async def _project(client: AsyncClient, name: str = "Test") -> str:
    resp = await client.post("/api/projects/", json={"name": name})
    assert resp.status_code == 201
    return str(resp.json()["id"])


async def _entry(
    client: AsyncClient, project_id: str, minutes_ago: int
) -> dict[str, Any]:
    now = datetime.now(UTC)
    start = now - timedelta(minutes=minutes_ago)
    end = start + timedelta(minutes=30)
    resp = await client.post(
        f"/api/projects/{project_id}/entries",
        json={
            "description": f"entry {minutes_ago}",
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
        },
    )
    assert resp.status_code == 201
    return cast(dict[str, Any], resp.json())


async def test_entries_requires_auth(client: AsyncClient) -> None:
    resp = await client.get(
        "/api/projects/00000000-0000-0000-0000-000000000000/entries"
    )
    assert resp.status_code == 401


async def test_create_entry_computes_duration(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    entry = await _entry(client, project_id, minutes_ago=5)
    assert entry["duration_seconds"] == 30 * 60


async def test_entries_returns_page_envelope(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    await _entry(client, project_id, minutes_ago=60)
    await _entry(client, project_id, minutes_ago=30)
    await _entry(client, project_id, minutes_ago=5)

    resp = await client.get(f"/api/projects/{project_id}/entries?limit=2")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["skip"] == 0
    assert body["limit"] == 2
    # newest first
    assert body["items"][0]["description"] == "entry 5"
    assert body["items"][1]["description"] == "entry 30"


async def test_entries_honors_skip(client: AsyncClient, db: AsyncSession) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    await _entry(client, project_id, minutes_ago=60)
    await _entry(client, project_id, minutes_ago=30)
    await _entry(client, project_id, minutes_ago=5)

    resp = await client.get(f"/api/projects/{project_id}/entries?skip=2&limit=2")
    assert resp.status_code == 200
    body = resp.json()
    assert body["skip"] == 2
    assert body["limit"] == 2
    assert len(body["items"]) == 1
    assert body["items"][0]["description"] == "entry 60"


async def test_entries_limit_is_capped(client: AsyncClient, db: AsyncSession) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    resp = await client.get(f"/api/projects/{project_id}/entries?limit=500")
    assert resp.status_code == 422


async def test_entries_foreign_project_404(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    other = await _project(client, name="Other")
    await _authed(client, db, email="other@example.com")
    # second user owns no projects; first user's project id is foreign
    resp = await client.get(f"/api/projects/{other}/entries")
    assert resp.status_code == 404


async def test_create_entry_rejects_inconsistent_duration(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    now = datetime.now(UTC)
    resp = await client.post(
        f"/api/projects/{project_id}/entries",
        json={
            "description": "inconsistent",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(minutes=30)).isoformat(),
            "duration_seconds": 999,
        },
    )
    assert resp.status_code == 422


async def test_create_entry_preserves_explicit_duration(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    now = datetime.now(UTC)
    resp = await client.post(
        f"/api/projects/{project_id}/entries",
        json={
            "description": "explicit",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(minutes=30)).isoformat(),
            "duration_seconds": 30 * 60,
        },
    )
    assert resp.status_code == 201
    assert resp.json()["duration_seconds"] == 30 * 60


async def test_create_entry_rejects_end_before_start(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    now = datetime.now(UTC)
    resp = await client.post(
        f"/api/projects/{project_id}/entries",
        json={
            "description": "backwards",
            "start_time": now.isoformat(),
            "end_time": (now - timedelta(minutes=30)).isoformat(),
        },
    )
    assert resp.status_code == 422


async def test_create_entry_allows_open_ended(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    now = datetime.now(UTC)
    resp = await client.post(
        f"/api/projects/{project_id}/entries",
        json={"description": "open", "start_time": now.isoformat()},
    )
    assert resp.status_code == 201
    assert resp.json()["end_time"] is None
    assert resp.json()["duration_seconds"] is None


async def test_update_entry_rejects_inconsistent_duration(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    entry = await _entry(client, project_id, minutes_ago=5)
    now = datetime.now(UTC)
    resp = await client.patch(
        f"/api/projects/{project_id}/entries/{entry['id']}",
        json={
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(minutes=45)).isoformat(),
            "duration_seconds": 10,
        },
    )
    assert resp.status_code == 422
