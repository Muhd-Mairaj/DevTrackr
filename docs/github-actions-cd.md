# GitHub Actions Continuous Deployment

## Overview

DevTrackr uses GitHub Actions to deploy automatically to staging and production.

- Pushes to `dev` deploy to the `staging` environment
- Pushes to `prod` deploy to the `production` environment
- Production deployments require manual approval via GitHub Environment protection rules

## Architecture

- Images are built in GitHub Actions and pushed to GitHub Container Registry (GHCR)
- The VPS pulls images and restarts the appropriate Docker Compose stack
- A health check runs after each deploy; if it fails, the previous images are redeployed automatically

## Required GitHub configuration

### Environments

Create two environments in the repository settings:

- `staging`
- `production`

### Secrets per environment

| Secret | Description |
|---|---|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USERNAME` | SSH user |
| `VPS_SSH_PRIVATE_KEY` | SSH private key |
| `GHCR_PULL_TOKEN` | GitHub PAT with `read:packages` — the VPS uses it to `docker login ghcr.io` and pull the private images |
| `SECRET_KEY` | FastAPI secret key |
| `ENCRYPTION_KEY` | Fernet encryption key |
| `POSTGRES_PASSWORD` | Database password |
| `GITHUB_CLIENT_ID` | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `SMTP_API_KEY` | Optional email API key |

### Variables per environment

| Variable | Description |
|---|---|
| `VPS_PROJECT_ROOT` | Directory on the VPS containing compose files |
| `DOMAIN` | Public domain |
| `FRONTEND_HOST` | Public frontend URL |
| `BACKEND_CORS_ORIGINS` | Allowed CORS origins |
| `POSTGRES_USER` | Database user |
| `POSTGRES_DB` | Database name |
| `POSTGRES_PORT` | Database host port |
| `FRONTEND_PORT` | Frontend host port |
| `BACKEND_PORT` | Backend host port |
| `VITE_API_URL` | Frontend API base URL |

## Operations

### View logs

```bash
cd /opt/devtrackr
docker compose logs -f backend
```

### Manual rollback

```bash
cd /opt/devtrackr
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --no-deps backend frontend
```

To pin to a specific image, set `BACKEND_IMAGE` and `FRONTEND_IMAGE` in `.env` first.

### Common issues

- **Port already allocated:** Ensure staging and production use different `FRONTEND_PORT`, `BACKEND_PORT`, and `POSTGRES_PORT` values.
- **Permission denied:** Verify the SSH key in GitHub secrets matches the authorized key on the VPS.
- **Image pull failed:** Confirm the VPS can reach `ghcr.io` and that `GHCR_PULL_TOKEN` is set to a valid PAT with `read:packages`. The workflow's `GITHUB_TOKEN` only authenticates the runner that builds and pushes — it does not reach the VPS, so the VPS logs in with `GHCR_PULL_TOKEN` instead. A `denied`/`unauthorized` error means that secret is missing, expired, or lacks `read:packages` (or the images aren't visible to that account).
