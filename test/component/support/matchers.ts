import { expect } from "@jest/globals"
import { Response } from "supertest"

declare module "@jest/expect" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<R> extends CustomMatchers<R> {}
}

type CustomMatchers<R = unknown> = {
  toHaveStatus(statusCode: number): R
  toHaveCookie(cookieName: string, expectedAttributes: string[]): R
  notToHaveCookie(cookieName: string): R
}

const pass = () => ({ pass: true, message: () => "Success" })
const fail = (message: string) => ({ pass: false, message: () => message })

expect.extend({
  toHaveStatus(response: Response, statusCode: number) {
    if (response.status !== statusCode) {
      return fail(`Expected status ${statusCode}, but got ${response.status}`)
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
  }
})
