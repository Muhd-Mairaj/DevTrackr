# 0001: Use Psycopg (v3) Built From Source for PostgreSQL

**Date:** 2026-02-27
**Status:** Accepted

## Context
DevTrackr's backend uses FastAPI, which requires asynchronous database queries to maintain high concurrency. We need an async-compatible PostgreSQL driver for SQLAlchemy.

We evaluated three primary options:
1. `asyncpg`: Highly performant, but lacks native/first-class support for SQLAlchemy's newer paradigms and requires a custom protocol.
2. `psycopg[binary]`: The modern v3 driver, pre-compiled. Easy to install, but bundles its own C libraries (`libpq`, `libssl`), which can occasionally conflict with the host OS libraries or mask security vulnerabilities.
3. `psycopg` (Source): The modern v3 driver, compiled at install time against the specific system libraries of our Docker OS.

## Decision
We will use `psycopg` (v3) and compile it from source during our Docker build process. We are explicitly rejecting `asyncpg` to maintain seamless SQLAlchemy 2.0 integration, and we are rejecting `psycopg[binary]` in favor of using native Debian system libraries.

## Consequences
* **Positive:** Excellent, native support for SQLAlchemy 2.0 and `AsyncSession`.
* **Positive:** Higher security and stability in production. By relying on the OS-level `libpq` and OpenSSL, any security patches applied to the base Debian image immediately protect our database connection.
* **Negative:** Increased Dockerfile complexity. We must install build dependencies (`gcc`, `libpq-dev`, `python3-dev`) in our `base` or `builder` Docker stages.
* **Negative:** Slightly slower Docker build times, as the C extension must be compiled from scratch during `uv sync`.
