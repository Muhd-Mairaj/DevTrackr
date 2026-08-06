import uuid

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


async def test_columns_requires_auth(client: AsyncClient) -> None:
    resp = await client.get(
        "/api/projects/00000000-0000-0000-0000-000000000000/columns"
    )
    assert resp.status_code == 401


async def test_columns_return_defaults_when_unset(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    resp = await client.get(f"/api/projects/{project_id}/columns")
    assert resp.status_code == 200
    body = resp.json()
    assert [c["kind"] for c in body] == [
        "TIME",
        "DURATION",
        "SOURCE",
        "DESCRIPTION",
    ]
    assert all(c["builtin"] for c in body)


async def test_put_columns_persists(client: AsyncClient, db: AsyncSession) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    payload = [
        {"kind": "TIME", "name": "When"},
        {"kind": "DURATION", "name": "Length"},
        {"kind": "SOURCE", "name": "Source"},
        {"kind": "DESCRIPTION", "name": "Details"},
        {"kind": "CUSTOM", "name": "Ticket"},
    ]
    resp = await client.put(f"/api/projects/{project_id}/columns", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert [c["name"] for c in body] == [
        "When",
        "Length",
        "Source",
        "Details",
        "Ticket",
    ]
    assert [c["builtin"] for c in body] == [True, True, True, True, False]

    # persisted, not defaulted
    resp = await client.get(f"/api/projects/{project_id}/columns")
    assert resp.json()[0]["name"] == "When"


async def test_put_columns_rejects_duplicate_builtin(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    payload = [
        {"kind": "TIME", "name": "Time"},
        {"kind": "TIME", "name": "When"},
        {"kind": "DURATION", "name": "Duration"},
        {"kind": "SOURCE", "name": "Source"},
        {"kind": "DESCRIPTION", "name": "Description"},
    ]
    resp = await client.put(f"/api/projects/{project_id}/columns", json=payload)
    assert resp.status_code == 422


async def test_put_columns_rejects_missing_builtin(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    payload = [
        {"kind": "TIME", "name": "Time"},
        {"kind": "DURATION", "name": "Duration"},
        {"kind": "SOURCE", "name": "Source"},
        # DESCRIPTION missing
        {"kind": "CUSTOM", "name": "Ticket"},
    ]
    resp = await client.put(f"/api/projects/{project_id}/columns", json=payload)
    assert resp.status_code == 422


async def test_put_columns_rejects_empty_name(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    payload = [
        {"kind": "TIME", "name": "  "},
        {"kind": "DURATION", "name": "Duration"},
        {"kind": "SOURCE", "name": "Source"},
        {"kind": "DESCRIPTION", "name": "Description"},
    ]
    resp = await client.put(f"/api/projects/{project_id}/columns", json=payload)
    assert resp.status_code == 422


async def test_put_columns_rejects_unknown_kind(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    project_id = await _project(client)
    payload = [
        {"kind": "TIME", "name": "Time"},
        {"kind": "DURATION", "name": "Duration"},
        {"kind": "SOURCE", "name": "Source"},
        {"kind": "DESCRIPTION", "name": "Description"},
        {"kind": "BOGUS", "name": "Nope"},
    ]
    resp = await client.put(f"/api/projects/{project_id}/columns", json=payload)
    assert resp.status_code == 422


async def test_columns_foreign_project_404(
    client: AsyncClient, db: AsyncSession
) -> None:
    await _authed(client, db)
    other = await _project(client, name="Other")
    await _authed(client, db, email="other@example.com")
    # second user owns no projects; first user's project id is foreign
    resp = await client.get(f"/api/projects/{other}/columns")
    assert resp.status_code == 404
