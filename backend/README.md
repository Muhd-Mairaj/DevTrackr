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
│   ├── routes/          # API route modules (auth, github, etc.)
│   ├── deps.py          # FastAPI dependencies (auth, session, etc.)
│   └── main.py          # Central router aggregator
├── core/
│   ├── __init__.py
│   └── config.py        # Settings and configuration (Pydantic Settings)
├── db/
│   ├── __init__.py
│   ├── base.py          # SQLAlchemy base and helper models
│   └── session.py       # Database session management
└── models/
    └── __init__.py      # SQLAlchemy/SQLModel tables
```

**Design Patterns:**
- **Modular Routes**: Organized under `app/api/routes` for maintainability
- **Dependency Injection**: Centralized in `app/api/deps.py`
- **Configuration Management**: Environment-based settings using Pydantic Settings
- **Database Session Management**: SQLAlchemy session factory pattern

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

### Code Formatting & Linting

To maintain code quality across the entire project (Backend & Frontend), use the provided format script from the project root:

**To check for issues (dry-run):**
```bash
./scripts/format.sh
```

**To automatically fix formatting and linting issues:**
```bash
./scripts/format.sh --fix
```

### Manual Backend-only Commands

**Linting and Formatting with Ruff:**
```bash
# Check formatting and linting
uv run ruff format --check .
uv run ruff check .

# Fix formatting and linting
uv run ruff format .
uv run ruff check --fix .
```

**Type Checking with Mypy:**
```bash
uv run mypy .
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

Database migrations are managed by Alembic.

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
- `GET /api/ping` - Health check endpoint

## Environment Variables

Required environment variables (see `.env.template`):

- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql+psycopg2://user:password@host:port/database`)
- `ENVIRONMENT` - Environment name (default: `development`)

## Configuration

- **Ruff**: Configured to use 88 character line length for both linting and formatting
- **Ruff Rules Enabled**:
  - E: Pycodestyle errors
  - F: Pyflakes
  - I: Import sorting (isort-compatible)
  - UP: Modernization rules (enforces modern Python syntax)
- **Excluded**: `migrations` folder is excluded from formatting/linting
