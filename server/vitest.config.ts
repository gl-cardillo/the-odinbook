import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setupEnv.ts"],
    // seeding the in-memory database takes a few seconds
    hookTimeout: 60000,
  },
});
