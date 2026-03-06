# DevTrackr Setup Guide

This guide provides detailed instructions for setting up and maintaining the DevTrackr development environment.

## 🏁 Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.13+** (managed by `uv` is recommended)
- **Bun** (for frontend and scripts)
- **Docker & Docker Compose** (for database and production-like environment)
- **Git**

## 📦 Initial Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Muhd-Mairaj/DevTrackr.git
cd DevTrackr
```

### 2. Backend Setup
We use `uv` for lightning-fast dependency management and virtual environments.
```bash
cd backend
uv sync
```

### 3. Frontend Setup
We use `bun` for the frontend runtime and package management.
```bash
cd frontend
bun install
```

### 4. Database Migrations
To ensure your local database matches the current application schema, perform an upgrade:
```bash
cd backend
uv run alembic upgrade head
```
For more details on schema changes, see the **[Database Migrations Guide](./database-migrations.md)**.

### 5. Pre-commit Setup
We use `pre-commit` to ensure code quality is checked automatically before every commit.
```bash
# Install the tool (if not already installed)
uv tool install pre-commit

# Activate the git hooks in the repository root
pre-commit install
```
This will run Ruff, MyPy, Biome, as well as some other checks automatically whenever you run `git commit`.

### 6. Configuration
Create your local environment files based on the templates:
```bash
# From the project root
cp .env.template .env
```
Edit the `.env` file to include your database credentials and API keys.

## 🎨 Code Quality (Formatting & Linting)

We maintain strict code quality standards to ensure consistency across the monorepo.

### The Standard Workflow
The easiest way to check and fix the entire project is using our shared script from the root:

**Check for issues (Dry-run):**
```bash
./scripts/format.sh
```

**Apply fixes automatically:**
```bash
./scripts/format.sh --fix
```

### Backend Tools (Ruff & Mypy)
- **Ruff**: Handles both linting and formatting for Python.
- **Mypy**: Performs strict static type checking.

```bash
cd backend
uv run ruff format .    # Format
uv run ruff check --fix . # Lint & Fix
uv run mypy .           # Type Check
```

### Frontend Tools (Biome)
- **Biome**: A single tool for formatting and linting the entire frontend.

```bash
cd frontend
bun run format          # Format
bun run check --write   # Lint & Fix
```

## 🔄 Synchronizing Client SDK

Whenever you change backend routes, models, or types, you must regenerate the frontend API client:
```bash
./scripts/generate-client.sh
```
This script ensures that the frontend TypeScript types match the backend's OpenAPI specification.

## 🚀 Running Locally

### With Docker (Recommended Service Setup)
```bash
docker compose watch
```
This will start the database, backend, and frontend, as well as ensure that the migrations are up to date.

### Individual Services
- **Backend**: `cd backend && uv run uvicorn app.main:app --reload`
- **Frontend**: `cd frontend && bun dev`
