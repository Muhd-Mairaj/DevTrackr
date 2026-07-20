# Stub OAuth Server Specification

Per **ADR 0003 (Use Vitest and Playwright for Frontend Testing and E2E)**, End-to-End (E2E) tests for integration features (GitHub OAuth, Toggl sync, repository integration) must operate deterministically without making real HTTP requests to external third-party identity providers during CI or local test execution.

## Requirements for Stub OAuth Server

When implementing the OAuth stub server for E2E tests, the stub must provide the following capabilities:

### 1. GitHub OAuth Flow Stubbing
- **Authorization Endpoint (`/api/auth/github/authorize` / stubbed GitHub OAuth endpoint)**:
  - Intercept or mock redirect to GitHub authorization dialog.
  - Return a valid or mock `code` and echo the CSRF `state` parameter passed in the request.
- **Token Exchange & Callback (`/api/auth/github/callback`)**:
  - Accept authorization code and exchange for a mock access token (`gho_mock_token_12345`).
- **User & Installation Probing (`/api/v1/github/...`)**:
  - Provide deterministic mock responses for authenticated user profile (e.g. `login: "test-user"`, `id: 123456`).
  - Provide mock repository list and webhook installation status.

### 2. Toggl Integration Stubbing
- **API Token / OAuth Exchange**:
  - Mock Toggl workspace authentication and entry listing endpoints.
  - Provide predictable time-entry payload structures for logbook generation testing.

### 3. Session & Cookie Isolation
- Ensure session cookies set during stub login/callback steps persist across multi-tab Playwright context navigation.
- Allow tests to configure initial user state (e.g., authenticated vs. unauthenticated, repository connected vs. unlinked) via HTTP headers or setup endpoints prior to test execution.

## Implementation Status

> **Note:** As specified in ADR 0003, the stub OAuth server is planned for the E2E integration test suite phase and is not yet implemented.
