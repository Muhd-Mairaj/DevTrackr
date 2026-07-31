---
name: write-pr-description
description: Use when creating pull requests in DevTrackr to write clear, structured PR descriptions that help reviewers understand changes. Tailored specifically for the DevTrackr monorepo (FastAPI backend + React/Bun frontend).
---

# Write PR Description

Generate structured pull request descriptions for DevTrackr that provide comprehensive context for reviewers by inspecting git diffs and commit logs.

## Trigger

Use this skill when the user runs `/write-pr-description`, or asks to "generate a PR description", "write a PR description", or "describe this PR".

---

## DevTrackr Project Context & Commands

DevTrackr is a monorepo containing a **FastAPI backend** (`backend/`) and a **React + TypeScript frontend** (`frontend/`).

### Built-in DevTrackr Commands Reference:

- **Full Project Format & Lint**: `./scripts/format.sh --fix` (Runs Ruff, MyPy, and Biome)
- **Backend Tests**: `cd backend && uv run pytest`
- **Backend Lint & Typecheck**: `cd backend && uv run ruff check .` and `cd backend && uv run mypy .`
- **Backend DB Migrations**: `cd backend && uv run alembic upgrade head`
- **Frontend Format & Lint**: `cd frontend && bun run check --write`
- **API Client Generation**: `./scripts/generate-client.sh`
- **Local Development / Services**: `docker compose watch` or (`cd backend && uv run uvicorn app.main:app --reload` and `cd frontend && bun dev`)

---

## Instructions

### Step 1: Collect Git Context

Run the following commands to determine what changed and collect context:

```bash
git diff main 2>/dev/null || git diff --staged || git diff HEAD~1 2>/dev/null
```

Also collect commit messages for context:

```bash
git log main..HEAD --oneline 2>/dev/null || git log --oneline -10 2>/dev/null
```

If there are many commits on the branch, use `git log main..HEAD` (without `--oneline`) to read full commit bodies.

---

### Step 2: Analyze Changes in DevTrackr Monorepo

Identify which components of DevTrackr were modified:
- **Backend (`backend/`)**: API endpoints (`app/api/`), Models (`app/models/`), Schemas (`app/schemas/`), Services (`app/services/`), Migrations (`alembic/`), Tests (`tests/`)
- **Frontend (`frontend/`)**: Components (`src/components/`), Routes (`src/routes/`), API Client (`src/client/`), Hooks (`src/hooks/`)
- **DevOps / Scripts**: `docker-compose*.yml`, `.github/workflows/`, `./scripts/`

Determine commit type (`feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `test`, `ci`) and check for breaking changes (schema updates, modified API contracts, removed fields).

---

### Step 3: Generate the PR Description

Check the correct box for the detected commit type (replace `[ ]` with `[x]`). If multiple types apply, check all that match.

```markdown
## Summary
{1-2 sentences explaining what this PR does at a high level and why it matters}

## Type of change
- [ ] feat: new feature
- [ ] fix: bug fix
- [ ] refactor: code change that doesn't add features or fix bugs
- [ ] chore: dependency updates, config, tooling
- [ ] docs: documentation only
- [ ] perf: performance improvement
- [ ] test: adding or updating tests
- [ ] ci: CI/CD changes

## What Changed
- {Bullet list of specific changes}
- {Focus on "what" not "how"}
- {Group related changes together}

### Why
- {Business context or technical motivation}
- {Problem being solved and why this approach was chosen}

## Screenshots (if applicable)
- {Before/after comparisons for UI changes, error states, or responsive viewports. Write "N/A" if not applicable.}

## How to test
1. {Numbered steps a reviewer would take to verify the changes work correctly}
2. {Include specific DevTrackr verification commands, e.g. `cd backend && uv run pytest`, `cd frontend && bun run check`, or `./scripts/format.sh`}

## Related Issues
- {Link to tickets: Closes #123, Refs #456, or "N/A"}

## Breaking changes
- {List breaking changes, or write "None"}
```

> **CRITICAL RULE FOR "What Changed"**: Do NOT list raw file names or paths (e.g. `backend/app/api/routes.py`). Instead, summarize the specific functional changes as a bullet list, focusing on "what" changed rather than "how", and grouping related changes together logically.

---

## DevTrackr "How to Test" Guidance

Always include exact DevTrackr test commands based on the modified area:

- **Backend Logic / API Changes**:
  ```bash
  cd backend
  uv run pytest
  uv run ruff check .
  uv run mypy .
  ```
- **Frontend Component / UI Changes**:
  ```bash
  cd frontend
  bun run check
  bun dev
  ```
- **Backend & Frontend API Synchronization**:
  ```bash
  ./scripts/generate-client.sh
  ./scripts/format.sh --fix
  ```
- **Database Schema & Migrations**:
  ```bash
  cd backend
  uv run alembic upgrade head
  ```
- **Full Stack / Containerized Workflow**:
  ```bash
  docker compose watch
  ```

---

## Integration with GitHub CLI (`gh pr create`)

When creating a pull request automatically via `gh`:

```bash
gh pr create --title "feat(backend): add Toggl sync endpoint" --body "$(cat <<'EOF'
## Summary
Adds automated Toggl time entry synchronization to link tracking logs with GitHub commits.

## Type of change
- [x] feat: new feature
- [ ] fix: bug fix

## What Changed
- Added Toggl OAuth & API synchronization endpoints
- Implemented time entry parser and GitHub commit matching service
- Updated database schema with time entry migration

## Why
Developers needed a seamless way to import time entries from Toggl into DevTrackr without manual copy-pasting.

## Screenshots (if applicable)
N/A

## How to test
1. Run backend test suite: `cd backend && uv run pytest`
2. Verify code quality: `./scripts/format.sh`

## Related Issues
Closes #42

## Breaking changes
None
EOF
)"
```

---

## Common Scenarios

- **Backend Endpoint / Model Feature**: Type: `feat` + `test` → Test steps: `cd backend && uv run pytest` & `./scripts/generate-client.sh`
- **Frontend Component Update**: Type: `feat` / `fix` → Test steps: `cd frontend && bun run check` & `bun dev`
- **Database Schema Migration**: Type: `chore` / `feat` → Test steps: `cd backend && uv run alembic upgrade head`
- **Monorepo Code Formatting / Lint Fixes**: Type: `chore` → Test steps: `./scripts/format.sh --fix`

---

## Output Checklist (Self-Review)

Before outputting the PR description, verify:

- [ ] Summary is 1-2 sentences and written from a reviewer's perspective
- [ ] At least one type checkbox is checked
- [ ] "What Changed" contains high-level functional changes grouped logically — NO file names or file paths listed!
- [ ] "What Changed" focuses on "what" not "how"
- [ ] "Why" clearly articulates the motivation or problem solved
- [ ] "How to test" uses exact DevTrackr commands (`uv run pytest`, `bun run check`, `./scripts/format.sh`, etc.)
- [ ] "Breaking changes" is either a specific list or "None"

## Benefits

- Reviewers understand context quickly
- Clear explanation of what and why
- Focused on changes and motivation
- No duplicate test/verification information
- Easy to reference later
- Better PR discussions
