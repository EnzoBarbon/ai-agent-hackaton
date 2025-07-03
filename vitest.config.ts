import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    testTimeout: 300000, // 5 minutes in milliseconds
    hookTimeout: 300000, // 5 minutes for setup/teardown hooks
  },
});
