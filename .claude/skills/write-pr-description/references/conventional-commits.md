# Conventional Commits Reference (DevTrackr)

Conventional Commits is a specification for adding human- and machine-readable meaning to commit messages. Format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

---

## Commit Types

| Type | Description | DevTrackr Area |
|------|-------------|----------------|
| `feat` | A new feature for the application | New API endpoints, UI components, integrations |
| `fix` | A bug fix | API error handling, UI state/rendering bugs |
| `refactor` | Code change that neither fixes a bug nor adds a feature | Restructuring backend services, UI helper cleanup |
| `chore` | Build process, dependency updates, tooling, config | `pyproject.toml`, `bun.lock`, scripts, config |
| `docs` | Documentation only changes | `README.md`, `docs/*.md`, docstrings, inline docs |
| `perf` | A code change that improves performance | DB indexing, query optimizations, React memoization |
| `test` | Adding or updating tests | Pytest in `backend/tests/`, frontend tests |
| `ci` | CI/CD changes | GitHub Actions (`.github/workflows/`), Docker configs |
| `style` | Formatting or style changes with no logic change | Biome or Ruff auto-formatting changes |
| `revert` | Reverts a previous commit | Reverting commits |

---

## Breaking Changes

A breaking change is indicated by:
1. A `!` after the type/scope: `feat(api)!: remove v1 logbook endpoint`
2. A `BREAKING CHANGE:` footer in the commit body

Examples in DevTrackr:
- Database schema changes requiring manual data migration or column deletion
- Renamed or removed FastAPI endpoints / field names in OpenAPI schema
- Changed authentication header specifications

---

## Detecting Type from Diff (DevTrackr Monorepo)

When commit messages are absent or unclear, infer the type based on modified DevTrackr file patterns:

- **`feat`**: New files in `backend/app/api/`, `backend/app/models/`, `frontend/src/components/`, `frontend/src/routes/`, new DB migration files in `backend/alembic/versions/`
- **`fix`**: Logic changes in existing FastAPI endpoints, exception handlers, React component bugfixes, null/undefined state handling
- **`refactor`**: Restructure of `backend/app/services/` or `frontend/src/hooks/`, helper function extraction without changing API contracts
- **`chore`**: `backend/pyproject.toml`, `backend/uv.lock`, `frontend/package.json`, `frontend/bun.lock`, `.pre-commit-config.yaml`, `scripts/format.sh`, `scripts/generate-client.sh`
- **`docs`**: `README.md`, `docs/*.md`, `backend/devtrackr.dbml`, docstring updates
- **`perf`**: SQLAlchemy query optimizations (e.g. `selectinload`), DB index additions in Alembic, component memoization
- **`test`**: `backend/tests/test_*.py`, test fixtures, frontend test files
- **`ci`**: `.github/workflows/*.yml`, `Dockerfile`, `docker-compose*.yml`

---

## Scope Conventions

Scopes describe the section of the DevTrackr monorepo being modified:

- **`backend`**: General backend changes
- **`frontend`**: General frontend UI/component changes
- **`api`**: FastAPI endpoints and OpenAPI schemas
- **`db`**: Database models, SQLAlchemy, or Alembic migrations
- **`auth`**: Authentication mechanisms (JWT, OAuth)
- **`toggl`**: Toggl integration & time tracking sync
- **`github`**: GitHub integration (commits, PRs, issues)
- **`logbook`**: Logbook generation and summary logic
- **`deps`**: Dependency updates in Python (`uv`) or Bun
- **`ci`**: GitHub Actions workflows or Docker setup
- **`scripts`**: Developer tooling scripts (`./scripts/format.sh`, `./scripts/generate-client.sh`)

---

## Examples

### Feature Commit
```
feat(toggl): add Toggl API synchronization endpoint

Implements automatic time entry fetching from Toggl to pair with GitHub activity.

Closes #42
```

### Bug Fix Commit
```
fix(frontend): prevent infinite refetching in logbook view

Added proper query key dependencies to TanStack Query hook to avoid redundant API calls.

Refs #89
```

### Breaking Change Commit
```
feat(api)!: update logbook entry response schema to camelCase

BREAKING CHANGE: All API responses from `/api/v1/logbooks` now use camelCase keys.
Frontend client SDK must be regenerated via `./scripts/generate-client.sh`.
```
