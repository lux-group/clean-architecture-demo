import { generateKeyPairSync } from "node:crypto"
import jwt from "jsonwebtoken"
import { SigningKey, User } from "~/domain/entities"
import { TokenRequest, TokenIssuer } from "~/domain/adapters"
import { JsonWebTokenIssuer } from "./JsonWebTokenIssuer"

describe("JsonWebTokenIssuer", () => {
  let tokenIssuer: TokenIssuer
  let baseTokenRequest: TokenRequest
  let user: User
  let signingKey: SigningKey
  
  const baseUrl = "https://auth.example.com"
  const lifetimeSeconds = 3600
  const audience = "test-audience"

  beforeAll(() => {
    const { privateKey: priv, publicKey: pub } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }
    })

    signingKey = SigningKey.createNew({
      privateKey: priv,
      publicKey: pub
    })
  })

  beforeEach(() => {
    tokenIssuer = new JsonWebTokenIssuer(baseUrl, { path: "/oauth2", lifetimeSeconds, audience })

    user = User.createNew({
      isEnabled: true,
      brand: "test-brand",
      givenName: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      emailVerified: true,
      phone: null,
      country: null,
      city: null,
      postcode: null,
      passwordHash: null,
      roles: ["user"],
    })

    baseTokenRequest = {
      sessionId: "session123",
      scopes: ["read", "write"],
      claims: { customClaim: "customValue" },
    }
  })

  describe("createAccessToken", () => {
    const decodeToken = (token: string) => {
      return jwt.verify(token, signingKey.publicKey, { algorithms: ["RS256"] }) as jwt.JwtPayload
    }

    it("should create a valid access token with correct structure", () => {
      const result = tokenIssuer.createAccessToken(user, signingKey, baseTokenRequest)

      expect(result.expiresIn).toBe(lifetimeSeconds)
      expect(typeof result.accessToken).toBe("string")

      const decoded = decodeToken(result.accessToken)
      expect(decoded.ver).toBe("2.0")
      expect(decoded.jti).toBeDefined()
      expect(decoded.iss).toBe(`${baseUrl}/oauth2`)
      expect(decoded.aud).toBe(audience)
      expect(decoded.sub).toBe(user.id)
      expect(decoded.sid).toBe(baseTokenRequest.sessionId)
      expect(decoded.scope).toBe("read write")
      expect(decoded.customClaim).toBe("customValue")
      expect(typeof decoded.iat).toBe("number")
      expect(typeof decoded.exp).toBe("number")
      expect(decoded.exp! - decoded.iat!).toBe(lifetimeSeconds)
    })

    it("should use custom audience when provided in request", () => {
      const customAudience = "custom-audience"
      const request = { ...baseTokenRequest, audience: customAudience }

      const result = tokenIssuer.createAccessToken(user, signingKey, request)
      const decoded = decodeToken(result.accessToken)

      expect(decoded.aud).toBe(customAudience)
    })

    it("should handle request without scopes", () => {
      const request = { ...baseTokenRequest, scopes: undefined }

      const result = tokenIssuer.createAccessToken(user, signingKey, request)
      const decoded = decodeToken(result.accessToken)

      expect(decoded.scope).toBeUndefined()
    })

    it("should handle empty scopes array", () => {
      const request = { ...baseTokenRequest, scopes: [] }

      const result = tokenIssuer.createAccessToken(user, signingKey, request)
      const decoded = decodeToken(result.accessToken)

      expect(decoded.scope).toBe("")
    })

    it("should handle request without sessionId", () => {
      const request = { ...baseTokenRequest, sessionId: undefined }

      const result = tokenIssuer.createAccessToken(user, signingKey, request)
      const decoded = decodeToken(result.accessToken)

      expect(decoded.sid).toBeUndefined()
    })

    it("should include all custom claims in the token payload", () => {
      const request = {
        ...baseTokenRequest,
        claims: {
          stringClaim: "value1",
          numberClaim: 42,
          booleanClaim: true,
          nestedClaim: { nested: "value" }
        }
      }

      const result = tokenIssuer.createAccessToken(user, signingKey, request)
      const decoded = decodeToken(result.accessToken)

      expect(decoded.stringClaim).toBe("value1")
      expect(decoded.numberClaim).toBe(42)
      expect(decoded.booleanClaim).toBe(true)
      expect(decoded.nestedClaim).toEqual({ nested: "value" })
    })

    it("should have expiration time greater than issued time", () => {
      const before = Math.floor(Date.now() / 1000)
      const result = tokenIssuer.createAccessToken(user, signingKey, baseTokenRequest)
      const after = Math.floor(Date.now() / 1000) + 1 // Add 1 second buffer for timing
      
      const decoded = decodeToken(result.accessToken)
      
      expect(decoded.iat).toBeGreaterThanOrEqual(before)
      expect(decoded.iat).toBeLessThanOrEqual(after)
      expect(decoded.exp).toBe(decoded.iat! + lifetimeSeconds)
    })

    it("should generate unique JTI for each token", () => {
      const result1 = tokenIssuer.createAccessToken(user, signingKey, baseTokenRequest)
      const result2 = tokenIssuer.createAccessToken(user, signingKey, baseTokenRequest)
      
      const decoded1 = decodeToken(result1.accessToken)
      const decoded2 = decodeToken(result2.accessToken)
      
      expect(decoded1.jti).not.toBe(decoded2.jti)
    })
  })
})
