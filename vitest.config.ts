import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    root: ".",
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["tests/unit/setup.ts"],
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "."),
      "#imports": resolve(__dirname, ".nuxt/imports.d.ts"),
    },
  },
});
