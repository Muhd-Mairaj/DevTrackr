#!/bin/bash
set -e
set -x

# Let the DB start
uv run python -m app.backend_prestart

# Run migrations
uv run alembic upgrade head

# optionally seed data
# uv run python -m app.backend_seed_data