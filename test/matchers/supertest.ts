import { Response } from "supertest"
import { expect } from "vitest"
import { Entity, EntityProps } from "~/domain/entities"
import { ObjectTransformer, toISODateString, toSnakeCase } from "~/lib/ObjectTransformer"

type SupertestResponseMatchers<R = unknown> = {
  toHaveStatus(statusCode: number): R
  toHaveCookie(cookieName: string, expectedAttributes: string[]): R
  notToHaveCookie(cookieName: string): R
  toMatchEntity(expectedObject: object): R
}

declare module "vitest" {
  interface Assertion<T = any> extends SupertestResponseMatchers<T> {}
  interface AsymmetricMatchersContaining extends SupertestResponseMatchers {}
}

const pass = () => ({ pass: true, message: () => "Success" })
const fail = (message: string, actual?: unknown, expected?: unknown) => ({ pass: false, message: () => message, actual, expected })

expect.extend({
  toHaveStatus(response: Response, statusCode: number) {
    if (response.status !== statusCode) {
      return fail(`Expected status ${statusCode}, but got ${response.status}`, response.status, statusCode)
    }
    return pass()
  },

  toHaveCookie(response: Response, cookieName: string, expectedAttributes: string[]) {
    const cookie = (response.headers["set-cookie"] as unknown as string[])?.find((cookie: string) => cookie.startsWith(`${cookieName}=`))
    if (!cookie) {
      return fail(`Expected response to contain cookie "${cookieName}"`)
    }

    const attributes = cookie.split(";").map(attr => attr.trim())
    for (const expectedAttribute of expectedAttributes) {
      if (!attributes.includes(expectedAttribute)) {
        return fail(`Expected cookie "${cookieName}" to have attribute "${expectedAttribute}"`)
      }
    }
    return pass()
  },

  notToHaveCookie(response: Response, cookieName: string) {
    const cookie = (response.headers["set-cookie"] as unknown as string[])?.find((cookie: string) => cookie.startsWith(`${cookieName}=`))
    if (cookie) {
      return fail(`Expected response not to contain cookie "${cookieName}"`)
    }
    return pass()
  },

  toMatchEntity(response: Response, expectedEntity: Entity<EntityProps>) {
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
      const expected = ObjectTransformer.transform(expectedEntity.props, [toSnakeCase], [toISODateString])
      
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
