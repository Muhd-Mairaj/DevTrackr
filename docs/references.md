### GitHub Actions:
- https://docs.github.com/en/actions/get-started/understand-github-actions
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/get-started/continuous-integration
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts

### GitHub Apps
- https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/using-webhooks-with-github-apps#choosing-a-webhook-url-for-development-and-testing
- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app#about-json-web-tokens-jwts

### ADR (Architecture Decision Record):
- https://github.com/joelparkerhenderson/architecture-decision-record?tab=readme-ov-file
- https://github.com/joelparkerhenderson/architecture-decision-record/tree/main/locales/en/templates/decision-record-template-by-michael-nygard

### Pre-Commit:
- https://pre-commit.com/
- Find more hooks here: https://pre-commit.com/hooks.html
- Used hooks:
    - https://github.com/pre-commit/pre-commit-hooks
    - https://github.com/astral-sh/ruff-pre-commit?tab=readme-ov-file#ruff-pre-commit
    - https://github.com/biomejs/pre-commit?tab=readme-ov-file#using-biome-with-a-local-pre-commit-hook

### Cryptography (Fernet):
- https://cryptography.io/en/latest/fernet/
- Used for transparently encrypting tokens.

### Mypy
- https://mypy.readthedocs.io/en/latest/extending_mypy.html
- https://docs.pydantic.dev/latest/integrations/mypy/#__tabbed_2_2

### Authlib
- https://docs.authlib.org/en/latest/
- https://docs.authlib.org/en/latest/client/frameworks.html#using-oauth-2-0-to-log-in
- https://docs.authlib.org/en/latest/client/fastapi.html
- https://docs.authlib.org/en/latest/client/starlette.html
- https://starlette.dev/middleware/#sessionmiddleware
- https://blog.authlib.org/2020/fastapi-google-login
- https://docs.github.com/en/rest/quickstart?apiVersion=2022-11-28

### Docker
- https://docs.docker.com/reference/compose-file/extension/
- https://docs.docker.com/engine/reference/builder/
- https://docs.docker.com/compose/compose-file/

### Testing (Backend)
- [Pytest Documentation](https://docs.pytest.org/en/stable/): The main testing framework used for the backend.
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/en/latest/): Essential for testing FastAPI's async endpoints and database operations.
- [SQLModel Testing](https://sqlmodel.tiangolo.com/tutorial/fastapi/tests/): Guidance on testing SQLModel applications with FastAPI.
- [Alembic Programmatic API](https://alembic.sqlalchemy.org/en/latest/api/commands.html): Used in `conftest.py` to ensure the test database is marked with the correct migration version.
- [Httpx Transports](https://www.python-httpx.org/advanced/transports/): Detailed explanation of how `ASGITransport` works for testing against local applications.
- [FastAPI Testing Tutorial](https://fastapi.tiangolo.com/tutorial/testing/): Official guide for testing FastAPI applications.
- [FastAPI Async Tests](https://fastapi.tiangolo.com/advanced/async-tests/): Guidance on testing async endpoints with HTTPX and pytest-asyncio.
