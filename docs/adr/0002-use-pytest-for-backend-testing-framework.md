# Use Pytest for Backend Testing Framework

**Date:** 2026-04-08
**Status:** Accepted

## Context
DevTrackr's backend, built with FastAPI and SQLAlchemy, involves complex asynchronous operations, database interactions with PostgreSQL, and integrations with external APIs such as GitHub. To ensure reliability and facilitate rapid development, we need a robust testing framework that:
*   Supports native `async/await` patterns.
*   Provides a powerful fixture system for modular test setup.
*   Allows for effective mocking of external services like the Gemini API to avoid quota issues and non-deterministic results.
*   Ensures database integrity and validates Alembic migrations.

### Options Considered
*   **unittest**: The built-in Python testing framework. While standard, it lacks the flexibility and advanced fixture system of Pytest, making complex async setups more verbose.
*   **Pytest with pure Mocking**: Very fast, but risks missing database-specific bugs or issues with complex SQLAlchemy queries that only surface against a real database.
*   **Pytest + Testcontainers (library)**: Provides high fidelity by managing ephemeral containers from within the test code. Rejected for now to avoid the overhead of the Testcontainers library itself and potential complexity in CI runner configurations. Instead, we'll use a standard Docker service container in CI for simplicity and speed.

## Decision
We will use **Pytest** as our primary testing framework for the backend.

Key implementation details:
*   **HTTPX**: Chosen over the default Starlette `TestClient` to support native `async` request-response cycles during integration tests.
*   **pytest-asyncio**: Configured in `auto` mode to allow seamless async test and fixture execution.
*   **unittest.mock / pytest-mock**: For intercepting and mocking external service calls (GitHub, Gemini API) to keep tests deterministic and cost-effective.
*   **Database Testing**:
    *   **Isolation**: Tests will use a transaction-based rollback strategy (using SQL Alchemy's `nested` transactions or similar) to ensure test isolation without the overhead of recreating the schema for every test.
    *   **CI Environment**: A PostgreSQL service container will be used in CI, matching the intended production database version.
*   **Alembic**: The suite will include a specific test to verify that the target test database schema is in sync with the current Alembic migration history.

## Consequences
*   **Positive**: High confidence in asynchronous logic and database interactions.
*   **Positive**: Pytest's fixture system makes setting up "dummy" GitHub and user data highly reusable and clean.
*   **Negative**: Test execution will be slower than pure unit tests due to the database overhead for integration tests.
*   **Negative**: Maintaining and updating mock responses for external APIs is required to keep tests deterministic.
*   **Neutral/Risk**: Developers must be mindful of transaction state when writing tests that perform complex multi-request flows.
