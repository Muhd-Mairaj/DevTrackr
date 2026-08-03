# DevTrackr

Monorepo: FastAPI backend (`backend/`), React frontend (`frontend/`), self-hosted via Docker.

## Frontend UI

The canonical UI design system lives in `docs/frontend-ui-spec.md`. Read it before any frontend UI work. Section 11 (Always / Never) is the fastest compliance check; section 2 (tokens) is the source of truth for values.

## Backend API

The canonical backend conventions live in `docs/backend-api-spec.md`. Read it before any backend work. Section 4 (object ownership / BOLA pattern) is required reading before writing any route that takes a resource `{id}`; section 8 (Always / Never) is the fastest compliance check.
