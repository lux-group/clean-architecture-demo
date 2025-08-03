import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    slowTestThreshold: 15000,
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
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
        }
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.spec.ts"],
          globalSetup: "./test/integration/vitest-setup.ts",
        }
      },
    ]
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
      "@test": resolve(__dirname, "./test"),
    },
  },
})
