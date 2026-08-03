import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // Read the file we just generated in the backend folder
  input: "../openapi.json",

  // Output destination
  output: "src/client",

  plugins: [
    "@hey-api/client-axios",
    {
      name: "@hey-api/typescript",
      enums: "javascript",
    },
    {
      name: "@hey-api/sdk",
      operations: { strategy: "byTags", containerName: "{{name}}Service" },
    },
  ],
});
