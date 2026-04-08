# Use Vitest and Playwright for Frontend Testing and E2E

**Date:** 2026-04-08
**Status:** Proposed

## Context
DevTrackr's frontend is built with **Vite**, **TypeScript**, **Tailwind CSS**, and **Biome**. We need a testing strategy that verifies:
*   Individual React components (including those from shadcn/ui) render correctly and handle user interactions.
*   The auto-generated OpenAPI client correctly interfaces with the FastAPI backend.
*   Complex user flows, such as GitHub/Toggl integration and logbook generation, work as expected across the full stack.

### Options Considered
*   **Jest**: Traditional choice for React testing. However, it requires complex Babel/Transformers configuration to work with Vite's ESM-first approach, leading to slower execution and maintenance overhead.
*   **Vitest**: A Vite-native testing framework that shares the same configuration and pipeline as the application. It offers exceptional speed, out-of-the-box TypeScript support, and a Jest-compatible API.
*   **Cypress**: A popular E2E tool, but it runs inside the browser which can limit certain multi-tab or cross-domain scenarios common in OAuth flows (like GitHub/Toggl).
*   **Playwright**: A modern E2E framework with superior multi-tab support, faster execution via worker processes, and excellent "trace" debugging capabilities.

## Decision
We will adopt **Vitest** for unit and component testing and **Playwright** for critical path End-to-End (E2E) testing.

Key implementation details:
*   **Vitest + React Testing Library**: Used for testing UI components and hooks. We will use `jsdom` as the test environment.
*   **Playwright**: Used for E2E testing of the most critical paths:
    *   Authentication and User Onboarding.
    *   GitHub Integration and Repository Sync.
    *   Logbook Generation Flow (UI to Backend to AI).
*   **Mocking**:
    *   For unit tests, we will use **MSW v2 (Mock Service Worker)** to intercept network requests at the fetch level. This ensures tests remain isolated from the backend while validating the auto-generated client's behavior.
    *   For E2E tests, we will run against a real backend instance. In CI, this will be orchestrated via a separate job where `docker-compose` brings up the full stack before running the Playwright suite.
*   **OAuth & Integration Testing**: To handle GitHub/Toggl OAuth flows without hitting real external services, we will use **stubbed identity provider responses** or a local mock OAuth server to keep E2E tests hermetic and deterministic.

## Consequences
*   **Positive**: **Fast Feedback Loop**: Vitest shares the Vite build pipeline, making unit tests extremely fast during development.
*   **Positive**: **High Fidelity Integration**: Playwright ensures that the "glue" logic between the frontend and the real API is functioning as intended.
*   **Positive**: **Type Safety**: Both Vitest and Playwright work natively with TypeScript, sharing our existing types and generated SDK definitions.
*   **Negative**: **Resource Overhead**: Playwright requires browser engines to be installed in the CI environment, increasing the size and setup time of CI/CD runners.
*   **Negative**: **Maintenance**: E2E tests are inherently more fragile than unit tests and will require maintenance as the UI evolves.
*   **Neutral/Risk**: **Orchestration Complexity**: Coordinating the frontend E2E suite with a live backend in CI requires robust health-check logic to ensure the database and API are ready before tests begin.
*   **Neutral/Risk**: We must ensure that the E2E environment in CI has proper access to the stubbed OAuth provider to avoid flaky or blocked tests.
