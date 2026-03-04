# DevTrackr Backend

Backend service for DevTrackr - a developer activity tracking and logging system.

## Tech Stack

- **Python**: 3.13
- **Web Framework**: FastAPI (0.119.1+)
- **ASGI Server**: Uvicorn with standard extras (0.38.0+)
- **ORM**: SQLAlchemy (2.0.44+)
- **Database**: PostgreSQL (via psycopg2-binary)
- **Configuration**: Pydantic Settings with python-dotenv
- **Database Migrations**: Alembic (1.17.0+)
- **Package Manager**: uv

## Development Tools

- **Code Formatting**: Ruff (line length: 88)
- **Linting**: Ruff (with Pycodestyle, Pyflakes, Import sorting, and modernization rules)
- **Type Checking**: mypy (strict mode), configured in pyproject.toml
- **Testing**: pytest

## Architecture

The backend follows a layered architecture pattern:

```
app/
├── main.py              # FastAPI application entry point
├── api/
│   └── v1/
│       ├── __init__.py
│       └── routes.py    # API v1 route definitions
├── core/
│   ├── __init__.py
│   └── config.py        # Settings and configuration (Pydantic Settings)
├── db/
│   ├── __init__.py
│   ├── base.py          # SQLAlchemy declarative base
│   └── session.py       # Database session management
└── models/
    └── __init__.py      # SQLAlchemy models
```

**Design Patterns:**
- **API Versioning**: Routes organized under `/api/v1` for future compatibility
- **Configuration Management**: Environment-based settings using Pydantic Settings
- **Database Session Management**: SQLAlchemy session factory pattern
- **Dependency Injection**: FastAPI's dependency injection for database sessions

## Prerequisites

- Python 3.13
- PostgreSQL database
- uv package manager

## Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment template from project root and configure your database:
   ```bash
   cp ../.env.template ../.env
   ```

   Edit `.env` and update the `POSTGRES_` variables with your PostgreSQL credentials.

3. Sync dependencies (this will create a virtual environment and install all dependencies):
   ```bash
   uv sync
   ```

## Running the Backend

Run the FastAPI development server with auto-reload:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Note: using `uv run fastapi dev app/main.py` is possible but needs creating an `__init__.py` file

The API will be available at:
- **API**: http://localhost:8000
- **Interactive API docs**: http://localhost:8000/docs
- **Alternative API docs**: http://localhost:8000/redoc

## Development

### Code Formatting

Format code with Black:
```bash
black .
```

### Linting

Check code with Ruff:
```bash
uv run ruff check .
```

Auto-fix issues:
```bash
uv run ruff check . --fix
```

### Testing

Run tests with pytest:
```bash
pytest
```

Run tests with coverage:
```bash
pytest --cov=.
```

## Database Migrations

> ⚠️ **Note**: Alembic is not yet configured for this project. The migration setup is pending.

Generate a new migration:
```bash
uv run alembic revision --autogenerate -m "description of changes"
```

Apply migrations:
```bash
uv run alembic upgrade head
```

Rollback one migration:
```bash
uv run alembic downgrade -1
```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/v1/ping` - Health check endpoint

## Environment Variables

Required environment variables (see `.env.template`):

- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql+psycopg2://user:password@host:port/database`)
- `ENVIRONMENT` - Environment name (default: `development`)

## Configuration

- **Black & Ruff**: Both configured to use 88 character line length
- **Ruff Rules Enabled**:
  - E: Pycodestyle errors
  - F: Pyflakes
  - I: Import sorting (isort-compatible)
  - UP: Modernization rules (enforces modern Python syntax)
- **Excluded**: `migrations` folder is excluded from formatting/linting
