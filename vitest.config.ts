import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000,
    slowTestThreshold: 15000,
    include: ["src/**/*.{test,spec}.ts"],
    globalSetup: "./test/vitest-setup.ts",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/index.ts",
        "src/data.ts",
      ],
    },
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
      "@test": resolve(__dirname, "./test"),
    },
  },
})
