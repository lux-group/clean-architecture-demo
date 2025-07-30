// Mock implementation for openid-client
export const discovery = jest.fn()
export const randomPKCECodeVerifier = jest.fn()
export const calculatePKCECodeChallenge = jest.fn()
export const randomNonce = jest.fn()
export const randomState = jest.fn()
export const buildAuthorizationUrl = jest.fn()
export const buildEndSessionUrl = jest.fn()
export const authorizationCodeGrant = jest.fn()
export const refreshTokenGrant = jest.fn()

// Mock error classes
export class ResponseBodyError extends Error {
  constructor(message: string, response: any) {
    super(message)
    this.name = "ResponseBodyError"
  }
}

const mockClient = {
  discovery,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  randomNonce,
  randomState,
  buildAuthorizationUrl,
  buildEndSessionUrl,
  authorizationCodeGrant,
  refreshTokenGrant,
  ResponseBodyError
}

export default mockClient
