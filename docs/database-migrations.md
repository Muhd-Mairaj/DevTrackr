# 🔄 Database Migrations (Alembic)

DevTrackr uses [Alembic](https://alembic.sqlalchemy.org/en/latest/) for handling database schema changes. Since we use `SQLModel`, Alembic is configured to detect changes automatically from our model definitions.

## 🛠️ Essential Commands

Run these commands from within the `backend/` directory:

### 1. Generating a New Migration
When you modify a model in `backend/app/models/`, you should generate a new migration file:
```bash
uv run alembic revision --autogenerate -m "description of your changes"
```
> [!IMPORTANT]
> **Always review the generated script** in `backend/app/alembic/versions/`. Automatic detection is good but not perfect (e.g., column renames are often detected as a delete + create).

### 2. Applying Migrations
To update your local database to the latest schema:
```bash
uv run alembic upgrade head
```

### 3. Rolling Back
To undo the last migration:
```bash
uv run alembic downgrade -1
```

## 🏗️ Technical Setup

- **Configuration**: The main config is in `backend/alembic.ini`.
    - **Post-Write Hooks**: We have configured Alembic to automatically format and lint newly generated migration scripts using **Ruff**. This is handled by the `[post_write_hooks]` section in `alembic.ini`, which runs `uv run ruff format` and `uv run ruff check --fix` on every new revision file.
- **Environment**: The `backend/app/alembic/env.py` file is configured to import all models, allowing it to detect schema changes.
- **Models**: Every new model should be imported in `backend/app/models/__init__.py`, or specifically in `env.py` to be visible to Alembic.

## 🐳 Docker Integration

In our standard development workflow:
- **Automatic**: `docker compose watch` or `docker compose up` typically handles basic service startup.
- **Local Execution**: Both generating and applying migrations should be performed **locally** from the `backend/` directory. Since the database is accessible locally (via port mapping), these commands will correctly update the database as required.

## 💡 Best Practices

1. **Keep it atomic**: One migration per logical change (e.g., "Add User bio" rather than "Updated stuff").
2. **Handle renames carefully**: Alembic might drop and recreate columns if you rename them. Edit the migration script to use `op.alter_column` if you want to preserve data.
3. **Double check types**: Ensure that SQLModel types (like `DateTime(timezone=True)`) are correctly reflected in the migration script.
