import { Config } from "jest"
import { pathsToModuleNameMapper } from "ts-jest"
import { compilerOptions } from "./tsconfig.json"

const config: Config = {
  testTimeout: 30000,
  preset: "ts-jest",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/data.ts",
  ],
  projects: [
    {
      displayName: "integration",
      testMatch: ["<rootDir>/src/**/*.spec.ts"],
      globalSetup: "<rootDir>/test/integration/setup.ts",
      globalTeardown: "<rootDir>/test/integration/teardown.ts",
      modulePaths: [compilerOptions.baseUrl],
      moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
      transform: {
        "^.+\\.ts$": "@swc/jest",
      },
      transformIgnorePatterns: [
        "node_modules/(?!(openid-client)/)"
      ],
      clearMocks: true,
      restoreMocks: true,
      slowTestThreshold: 15,
    },
    {
      displayName: "unit", 
      testMatch: ["<rootDir>/src/**/*.test.ts"],
      modulePaths: [compilerOptions.baseUrl],
      moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
      transform: {
        "^.+\\.ts$": "@swc/jest",
      },
      transformIgnorePatterns: [
        "node_modules/(?!(openid-client)/)"
      ],
      clearMocks: true,
      restoreMocks: true,
      slowTestThreshold: 15,
    },
  ]
}

export default config
