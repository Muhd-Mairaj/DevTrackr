import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://backend:8000",
        // Keep the original Host (localhost:5173) instead of rewriting it to the
        // target. The backend reflects Host into the GitHub OAuth redirect_uri, so
        // rewriting it would produce an unreachable backend:8000 callback. This
        // mirrors prod nginx (`proxy_set_header Host $host`).
        changeOrigin: false,
      },
    },
  },
});
