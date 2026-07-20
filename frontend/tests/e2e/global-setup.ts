import type { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0]?.use || {};
  const targetUrl = baseURL || "http://localhost:5173";

  console.log(
    `[Playwright Global Setup] Checking health of server at ${targetUrl}...`,
  );

  const maxAttempts = 15;
  const delayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(targetUrl);
      if (res.ok || res.status < 500) {
        console.log(
          `[Playwright Global Setup] Target server at ${targetUrl} is ready (status ${res.status}).`,
        );
        return;
      }
    } catch (_err) {
      // Server warming up or not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  console.warn(
    `[Playwright Global Setup] Server at ${targetUrl} did not respond within timeout. Continuing test run.`,
  );
}

export default globalSetup;
