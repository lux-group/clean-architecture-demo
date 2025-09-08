import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    slowTestThreshold: 30000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/__tests__/**",
        "src/**/*.d.ts",
        "src/**/types.ts",
        "src/**/index.ts",
        "src/data.ts",
        "src/app/ports",
        "src/domain/events",
        "src/domain/repositories",
        "src/infrastructure/config",
        "src/infrastructure/repositories/memory",
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
          testTimeout: 30000,
        }
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/app/**/*.spec.ts"],
          globalSetup: "./test/integration/vitest-setup.ts",
          testTimeout: 30000,
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
