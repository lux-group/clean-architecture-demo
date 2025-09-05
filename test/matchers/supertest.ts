import { Response } from "supertest"
import { expect } from "vitest"
import { Entity, EntityProps } from "~/domain/entities"
import { transformObject, toISODateString, toSnakeCase } from "~/lib/transformObject"

type SupertestResponseMatchers<R = unknown> = {
  bodyToMatchEntity(expectedEntity: Entity<EntityProps>): R
}

declare module "vitest" {
  interface Assertion<T = any> extends SupertestResponseMatchers<T> {}
  interface AsymmetricMatchersContaining extends SupertestResponseMatchers {}
}

const pass = () => ({ pass: true, message: () => "Success" })
const fail = (message: string, actual?: unknown, expected?: unknown) => ({ pass: false, message: () => message, actual, expected })

expect.extend({
  bodyToMatchEntity(response: Response, expectedEntity: Entity<EntityProps>) {
    // Helper function to check if object matches (partial match like objectContaining)
    const objectMatches = (actual: any, expected: any): boolean => {
      if (expected === null || typeof expected !== "object") {
        return actual === expected
      }

      if (Array.isArray(expected)) {
        if (!Array.isArray(actual) || actual.length !== expected.length) {
          return false
        }
        return expected.every((item, index) => objectMatches(actual[index], item))
      }

      if (actual === null || typeof actual !== "object") {
        return false
      }

      // Check if all expected properties exist and match in actual object
      for (const [key, value] of Object.entries(expected)) {
        if (key in actual && !objectMatches(actual[key], value)) {
          return false
        }
      }
      return true
    }

    try {
      const responseBody = response.body
      const expected = transformObject(expectedEntity.props, [toSnakeCase], [toISODateString])
      
      if (objectMatches(responseBody, expected)) {
        return pass()
      } else {
        return fail(
          `Expected response body to match object`,
          responseBody,
          expected
        )
      }
    } catch (error) {
      return fail(`Error parsing response body: ${error}`)
    }
  }
})
