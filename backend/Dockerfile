FROM python:3.14.2-slim-trixie AS base
COPY --from=docker.io/astral/uv:0.9.27 /uv /uvx /bin/

WORKDIR /app

# Ensure the created virtual environment is used for all commands
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

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

# Install project and dev dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS prod

COPY . .

# Enable bytecode compilation,
# improve startup time but higher install time and image size
ENV UV_COMPILE_BYTECODE=1

# Install the project without dev dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]