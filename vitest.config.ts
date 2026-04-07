import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["e2e/**", "tests/load/**", "node_modules/**", ".next/**"],
  },
});
