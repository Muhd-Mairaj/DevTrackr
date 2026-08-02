# DevTrackr Backend API Spec

**The canonical reference for all AI agents working on the DevTrackr backend.**
If a backend decision is not covered here, follow the closest existing pattern in `backend/app` and note the gap. Do not invent new conventions for routing, auth, or data access.

**How to use this document:**

1. Read section 8 (Always / Never cheat sheet) first. It is the fastest way to avoid a violation.
2. Read section 4 (Object ownership) before writing any route that takes a resource `{id}`. It is the source of truth for authorization on user-owned resources.
3. Read the section relevant to the work: dependencies before routes, CRUD before data access.
4. When in doubt, match the existing modules in `backend/app/api/routes` rather than creating new ones.

---

## 1. Stack and layout

- FastAPI (async), SQLModel on async SQLAlchemy, Postgres, Alembic for migrations.
- Layout:
  - `app/api/routes/`: one module per resource (auth, github, project, utils)
  - `app/api/deps.py`: shared dependency aliases (cross-cutting: auth, session, JWT)
  - `app/api/main.py`: router registration
  - `app/crud/`: one data-access module per model
  - `app/models/`: SQLModel tables plus create/update/public schemas
  - `app/core/`: config, security helpers
- Tools: ruff (E, W, F, B, C4, UP, I, ARG001), mypy `--strict`, pytest.

---

## 2. Dependencies (`app/api/deps.py`)

Cross-cutting dependencies (`CurrentUser`, `SessionDep`, `GithubJWT`) are defined once as `Annotated` aliases in `deps.py`. Per-resource ownership dependencies (`get_owned_<resource>`, `Owned<Resource>`) live in the route module alongside the routes that use them:

| Alias | Meaning |
|---|---|
| `CurrentUser` | Authenticated user; 401 if no/invalid token, 404 if the user no longer exists, 403 if inactive |
| `OptionalCurrentUser` | `CurrentUser` that returns `None` instead of failing (public endpoints) |
| `GithubJWT` | GitHub App JWT signing token |
| `SessionDep` | Async DB session |
| `Owned<Resource>` | Resource verified to belong to the current user (section 4) |

- Authentication reads the access-token cookie first, then falls back to the OAuth2 bearer header.
- Routes never decode tokens and never build `Depends(get_db)`. They compose `CurrentUser` and `SessionDep` from `deps.py`. Ownership dependencies (`get_owned_<resource>`, `Owned<Resource>`) are defined in the route module they protect.
- A route without `CurrentUser` is unauthenticated by definition. Every route that reads or writes user-scoped data declares `user: CurrentUser` (or takes an `Owned<Resource>` alias that embeds it).

---

## 3. Auth conventions

- Access tokens live in a cookie (`ACCESS_TOKEN_COOKIE_NAME`) with bearer-header fallback.
- Status codes: 401 for missing or invalid credentials, 403 only for inactive users, 404 when an authenticated identity no longer exists.
- There is no middleware that auto-protects routes. Protection is explicit per route via `CurrentUser`.
- Optional identity (for public-ish endpoints) uses `OptionalCurrentUser`; it returns `None` for anonymous callers.

---

## 4. Object ownership (BOLA pattern): required for every `/{id}` route

This is the core convention. Every route that takes a user-owned resource id follows exactly this shape. No exceptions, no inline checks.

### 4.1 Why

BOLA (OWASP API1:2023, the top API risk) happens when an endpoint fetches a resource by id without verifying the caller owns it. Inline checks drift: they get forgotten on new routes and skipped on some verbs. This happened in this repo: `GET /projects/{id}` returned any project by UUID with no auth at all while sibling routes checked ownership inline. The pattern below centralizes the check in one dependency per resource, so every verb gets it by composition.

### 4.2 The two layers

1. **CRUD layer.** Fetch functions scope the query by user: `get_<resource>_for_user(*, session, id, user_id)` runs `select(Resource).where(Resource.id == id, Resource.user_id == user_id)`. The database cannot return a foreign row, so a leak is impossible even if a caller forgets the check.
2. **Dependency layer.** `get_owned_<resource>` in the route module depends on `SessionDep`, `CurrentUser`, and the path `id`, calls the scoped fetch, raises 404 on `None`, and returns the ORM object. Exposed as an `Owned<Resource>` `Annotated` alias so every verb composes the same check.

### 4.3 Canonical template

CRUD (`app/crud/<resource>.py`):

```python
async def get_project_for_user(
    *, session: AsyncSession, id: uuid.UUID, user_id: uuid.UUID
) -> Project | None:
    statement = select(Project).where(
        Project.id == id, Project.user_id == user_id
    )
    result = await session.exec(statement)
    return result.one_or_none()
```

Dependency (in the route module, e.g. `app/api/routes/project.py`):

```python
async def get_owned_project(
    session: SessionDep,
    user: CurrentUser,
    id: uuid.UUID,
) -> Project:
    project = await get_project_for_user(session=session, id=id, user_id=user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return project

OwnedProject = Annotated[Project, Depends(get_owned_project)]
```

Routes (`app/api/routes/<resource>.py`):

```python
@router.get("/{id}", response_model=ProjectPublic)
async def get_project_route(project: OwnedProject) -> Any:
    return project


@router.patch("/{id}", response_model=ProjectPublic)
async def update_project_route(
    session: SessionDep,
    project: OwnedProject,
    project_in: ProjectUpdate,
) -> Any:
    return await update_project(session=session, db_obj=project, project_in=project_in)


@router.delete("/{id}", response_model=ProjectPublic)
async def delete_project_route(session: SessionDep, project: OwnedProject) -> Any:
    await delete_project(session=session, db_obj=project)
    return project
```

### 4.4 Rules

- The dependency parameter must be named `id` so it binds the path param.
- **404 for missing and foreign objects, never 403.** Identical responses hide resource existence; a 403 would confirm the object is there, turning the route into an enumeration oracle.
- Routes never fetch by raw id. Unscoped `session.get(Model, id)` or unscoped CRUD fetches are forbidden in route modules.
- List routes scope the query by `user_id` in the DB (as `get_projects_by_user` does); they never filter by a client-supplied owner.
- FastAPI caches dependency results per request, so the fetch and check run once even when several dependencies chain off it.
- New user-owned models follow the same shape: scoped CRUD fetch, `get_owned_<resource>` dependency, `Owned<Resource>` alias, and routes that declare the alias instead of a raw `id` parameter.

---

## 5. Route conventions

- One router module per resource in `app/api/routes/`, with a `prefix` and `tags`, registered in `app/api/main.py` via `include_router`.
- Routes declare `response_model` and return the object or `-> Any`, matching `project.py`.
- Create routes return 201 (`status_code=201`).
- Errors are `HTTPException` with a plain detail string ("Project not found" style). No ownership logic in route bodies (section 4).
- The OpenAPI client (`frontend/src/client`) is regenerated from the backend's `openapi.json`; signature changes to schemas require a client regen.

---

## 6. CRUD conventions (`app/crud/`)

- One module per model; functions are keyword-only (`*, session, ...`).
- Create: validate, add, commit, refresh, return.
- Update: apply `model_dump(exclude_unset=True)` fields, add, commit, refresh, return.
- Delete: `session.delete`, commit.
- Fetch functions that take a user-supplied id also take `user_id` and scope the query (section 4). List fetches always filter by `user_id`.

---

## 7. Testing

- pytest; tests live in `backend/tests`.
- Every `/{id}` route needs the BOLA cases (the OWASP-recommended tests):
  - Foreign user's token with another user's resource id: GET, PATCH, DELETE all return 404.
  - No token: GET, PATCH, DELETE all return 401.
  - Owner: GET returns 200 with the resource; mutations return 200 and take effect.
  - A second mutation on the now-deleted id returns 404.
  (These tests are required before merging any new `/{id}` route; the existing project routes need them retroactively.)

---

## 8. Always / Never cheat sheet

### Always

- Declare `user: CurrentUser` on every route that touches user data.
- Use the `Owned<Resource>` dependency for every `/{id}` route; fetch through the scoped CRUD function (`get_<resource>_for_user`).
- Return 404 for missing and foreign objects; 401 for missing or invalid auth; 403 only for inactive users.
- Define cross-cutting dependencies (`CurrentUser`, `SessionDep`, `GithubJWT`) in `deps.py` as `Annotated` aliases. Define per-resource ownership dependencies (`Owned<Resource>`) in the route module.
- Scope list queries by `user_id` in the database query.
- Match the existing route, deps, and CRUD modules before building new ones.

### Never

- No raw `session.get(Model, id)` or unscoped fetch in a route.
- No inline ownership checks in route bodies; this is what caused the `GET /projects/{id}` hole.
- No inline ownership checks in route bodies; use the `Owned<Resource>` dependency pattern.
- No 403 to signal "you do not own this object"; use 404.
- No route that reads user data without `CurrentUser`.
