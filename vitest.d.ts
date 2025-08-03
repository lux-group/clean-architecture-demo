/// <reference types="vitest/globals" />

type SupertestResponseMatchers<R = unknown> = {
  toHaveStatus(statusCode: number): R
  toHaveCookie(cookieName: string, expectedAttributes: string[]): R
  notToHaveCookie(cookieName: string): R
}

declare module "vitest" {
  interface Assertion<T = any> extends SupertestResponseMatchers<T> {}
  interface AsymmetricMatchersContaining extends SupertestResponseMatchers {}
}
