import { Response } from "supertest"

const pass = () => ({ pass: true, message: () => "Success" })
const fail = (message: string) => ({ pass: false, message: () => message })

export const supertestMatchers = {
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
}

// Export a function to set up the matchers when needed
export function setupSupertestMatchers() {
  expect.extend(supertestMatchers)
}

// For backward compatibility, you can also export individual matchers
export const { toHaveStatus, toHaveCookie, notToHaveCookie } = supertestMatchers
