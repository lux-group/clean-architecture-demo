import { pathsToModuleNameMapper } from "ts-jest"
import { Config } from "jest"
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
      displayName: "component",
      testMatch: ["<rootDir>/test/component/**/*.test.ts"],
      globalSetup: "<rootDir>/test/component/setup.ts",
      globalTeardown: "<rootDir>/test/component/teardown.ts",
      setupFilesAfterEnv: ["<rootDir>/test/component/support/matchers.ts"],
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
      slowTestThreshold: 10,
    },
    {
      displayName: "integration", 
      testMatch: ["<rootDir>/test/integration/**/*.test.ts"],
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
      slowTestThreshold: 10,
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
    },
  ]
}

export default config
