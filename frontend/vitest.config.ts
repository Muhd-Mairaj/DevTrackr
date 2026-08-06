import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["tests/e2e/**/*", "node_modules/**/*"],
      // Time assertions in tests assume UTC rendering.
      env: { TZ: "UTC" },
    },
  }),
);
