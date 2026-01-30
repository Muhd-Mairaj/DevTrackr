FROM python:3.13-slim-bookworm AS base
COPY --from=docker.io/astral/uv:0.9.27 /uv /uvx /bin/

WORKDIR /app

# Install Build Dependencies required to compile some packages
# libpq-dev: Required to link against Postgres
# gcc, python3-dev: Required to compile the C extension
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Ensure the created virtual environment is used for all commands
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Use the system python
ENV UV_SYSTEM_PYTHON=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Ensure installed tools can be executed out of the box
ENV UV_TOOL_BIN_DIR=/usr/local/bin

COPY pyproject.toml uv.lock ./

# Install dependencies but not the project itself
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project --no-dev

FROM base AS dev

COPY . .

# Ensure prestart script has execute permissions
RUN chmod +x ./scripts/prestart.sh

# Install project and dev dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS prod

COPY . .

# Ensure prestart script has execute permissions
RUN chmod +x ./scripts/prestart.sh

# Enable bytecode compilation,
# improve startup time but higher install time and image size
ENV UV_COMPILE_BYTECODE=1

# Install the project without dev dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]