import { fail } from "node:assert"
import { describe, expect, it } from "vitest"
import { InvalidOperationError } from "~/domain/errors"
import { CreateSessionProps, Session } from "./Session"

describe("Session", () => {
  const mockCreateProps: CreateSessionProps = {
    userId: "f32a9a37-4fa0-4fdc-b294-4812137f4083",
    identityProviderId: "22222222-63BB-459B-A233-176BB712DE05",
    identityProviderSessionId: "idp-session-123",
    idToken: "mock-id-token",
    refreshToken: "refresh-token",
  }

  const mockLocalSessionProps: CreateSessionProps = {
    userId: "f32a9a37-4fa0-4fdc-b294-4812137f4083",
    identityProviderId: null,
    identityProviderSessionId: null,
    idToken: null,
    refreshToken: null,
  }

  describe("createNew", () => {
    it("should create a new Session with generated properties", () => {
      const expiresInHours = 24
      const session = Session.createNew(mockCreateProps, expiresInHours)

      expect(session.id).toBeDefined()
      expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(session.createdAt).toBeInstanceOf(Date)
      expect(session.lastRefreshAt).toBeInstanceOf(Date)
      expect(session.expiresAt).toBeInstanceOf(Date)
      expect(session.terminatedAt).toBeNull()
      expect(session.status).toBe("ACTIVE")
      expect(session.nonce).toBeDefined()
      expect(session.nonce).toHaveLength(40)
      expect(session.userId).toBe(mockCreateProps.userId)

      // Check expiration time is approximately correct
      const expectedExpirationTime = Date.now() + expiresInHours * 3600000
      const actualExpirationTime = session.expiresAt.getTime()
      expect(Math.abs(actualExpirationTime - expectedExpirationTime)).toBeLessThan(1000) // within 1 second
    })

    it("should create local session when identity provider is null", () => {
      const session = Session.createNew(mockLocalSessionProps, 1)

      expect(session.identityProviderId).toBeNull()
      expect(session.identityProviderSessionId).toBeNull()
      expect(session.idToken).toBeNull()
      expect(session.refreshToken).toBeNull()
    })

    it.each([
      { path: "userId", value: null, error: "expected string" },
      { path: "userId", value: "foo", error: "Invalid UUID" },
      { path: "identityProviderId", value: "foo", error: "Invalid UUID" },
    ])("should throw a validation error when $path is $value", async ({ path, value, error }) => {
      try {
        Session.createNew({ ...mockCreateProps, [path]: value }, 24)
        fail("Expected validation error to be thrown")
      } catch (thrownError: any) {
        expect(thrownError.errors).toBeDefined()
        expect(thrownError.errors[0].path).toContain(path)
        expect(thrownError.errors[0].message).toContain(error)
      }
    })
  })

  describe("isActive", () => {
    it("should return true for active session that hasn't expired", () => {
      const session = Session.createNew(mockCreateProps, 2)

      expect(session.isActive).toBe(true)
    })

    it("should return false for expired session", () => {
      const session = Session.createNew(mockCreateProps, -1) // Negative hours = expired

      expect(session.isActive).toBe(false)
    })

    it("should return false for terminated session even if not expired", () => {
      const session = Session.createNew(mockCreateProps, 24)
      session.terminateSessionByAdmin()

      expect(session.isActive).toBe(false)
    })
  })

  describe("ensureIsLocalSession", () => {
    it("should not throw for local session", () => {
      const session = Session.createNew(mockLocalSessionProps, 1)

      expect(() => {
        session.ensureIsLocalSession()
      }).not.toThrow()
    })

    it("should throw InvalidOperationError for identity provider session", () => {
      const session = Session.createNew(mockCreateProps, 1)

      expect(() => {
        session.ensureIsLocalSession()
      }).toThrow(InvalidOperationError)

      expect(() => {
        session.ensureIsLocalSession()
      }).toThrow(/is not a local session/)
    })
  })

  describe("ensureIsIdentityProviderSession", () => {
    it("should not throw for identity provider session", () => {
      const session = Session.createNew(mockCreateProps, 1)

      expect(() => {
        session.ensureIsIdentityProviderSession()
      }).not.toThrow()
    })

    it("should throw InvalidOperationError for local session", () => {
      const session = Session.createNew(mockLocalSessionProps, 1)

      expect(() => {
        session.ensureIsIdentityProviderSession()
      }).toThrow(InvalidOperationError)

      expect(() => {
        session.ensureIsIdentityProviderSession()
      }).toThrow(/is not an identity provider session/)
    })
  })

  describe("isIdentityProviderRefreshDue", () => {
    it("should return false for local session", () => {
      const session = Session.createNew(mockLocalSessionProps, 1)

      expect(session.isIdentityProviderRefreshDue(30)).toBe(false)
    })

    it("should return true when refresh is due", () => {
      const session = Session.createNew(mockCreateProps, 1)

      // Mock old lastRefreshAt by creating session with past date
      const pastDate = new Date(Date.now() - 35 * 60000) // 35 minutes ago
      const sessionWithOldRefresh = new Session({ ...session.props, lastRefreshAt: pastDate })

      expect(sessionWithOldRefresh.isIdentityProviderRefreshDue(30)).toBe(true)
    })

    it("should return false when refresh is not due", () => {
      const session = Session.createNew(mockCreateProps, 1)

      expect(session.isIdentityProviderRefreshDue(30)).toBe(false)
    })
  })

  describe("setLastRefresh", () => {
    it("should update lastRefreshAt timestamp", () => {
      const session = Session.createNew(mockCreateProps, 1)
      const originalRefreshAt = session.lastRefreshAt.getTime()

      // Wait a tiny bit to ensure different timestamp
      const start = Date.now()
      while (Date.now() === start) {
        // busy wait for 1ms
      }

      session.setLastRefresh()

      expect(session.lastRefreshAt.getTime()).toBeGreaterThanOrEqual(originalRefreshAt)
    })

    it("should update tokens when provided", () => {
      const session = Session.createNew(mockCreateProps, 1)
      const newIdToken = "new-id-token"
      const newRefreshToken = "new-refresh-token"

      session.setLastRefresh(newIdToken, newRefreshToken)

      expect(session.idToken).toBe(newIdToken)
      expect(session.refreshToken).toBe(newRefreshToken)
    })

    it("should preserve existing tokens when not provided", () => {
      const session = Session.createNew(mockCreateProps, 1)
      const originalIdToken = session.idToken
      const originalRefreshToken = session.refreshToken

      session.setLastRefresh()

      expect(session.idToken).toBe(originalIdToken)
      expect(session.refreshToken).toBe(originalRefreshToken)
    })
  })

  describe("termination methods", () => {
    describe("expire", () => {
      it("should set status to EXPIRED", () => {
        const session = Session.createNew(mockCreateProps, 1)

        session.expire()

        expect(session.status).toBe("EXPIRED")
        expect(session.terminatedAt).toBeInstanceOf(Date)
      })
    })

    describe("terminateLocalSessionByUser", () => {
      it("should terminate local session by user", () => {
        const session = Session.createNew(mockLocalSessionProps, 1)

        session.terminateLocalSessionByUser()

        expect(session.status).toBe("TERMINATED_BY_USER")
        expect(session.terminatedAt).toBeInstanceOf(Date)
      })

      it("should throw for identity provider session", () => {
        const session = Session.createNew(mockCreateProps, 1)

        expect(() => {
          session.terminateLocalSessionByUser()
        }).toThrow(InvalidOperationError)
      })
    })

    describe("terminateIdentityProviderSessionByUser", () => {
      it("should terminate identity provider session by user", () => {
        const session = Session.createNew(mockCreateProps, 1)

        session.terminateIdentityProviderSessionByUser()

        expect(session.status).toBe("TERMINATED_BY_USER")
        expect(session.terminatedAt).toBeInstanceOf(Date)
      })

      it("should throw for local session", () => {
        const session = Session.createNew(mockLocalSessionProps, 1)

        expect(() => {
          session.terminateIdentityProviderSessionByUser()
        }).toThrow(InvalidOperationError)
      })
    })

    describe("terminateSessionByIdentityProvider", () => {
      it("should terminate session by identity provider", () => {
        const session = Session.createNew(mockCreateProps, 1)

        session.terminateSessionByIdentityProvider()

        expect(session.status).toBe("TERMINATED_BY_PROVIDER")
        expect(session.terminatedAt).toBeInstanceOf(Date)
      })

      it("should throw for local session", () => {
        const session = Session.createNew(mockLocalSessionProps, 1)

        expect(() => {
          session.terminateSessionByIdentityProvider()
        }).toThrow(InvalidOperationError)
      })
    })

    describe("terminateSessionByAdmin", () => {
      it("should terminate session by admin", () => {
        const session = Session.createNew(mockCreateProps, 1)

        session.terminateSessionByAdmin()

        expect(session.status).toBe("TERMINATED_BY_ADMIN")
        expect(session.terminatedAt).toBeInstanceOf(Date)
      })
    })

    describe("already terminated sessions", () => {
      it("should not change status if session is already terminated", () => {
        const session = Session.createNew(mockCreateProps, 1)
        session.terminateSessionByAdmin()
        const firstTerminatedAt = session.terminatedAt

        session.expire()

        expect(session.status).toBe("TERMINATED_BY_ADMIN")
        expect(session.terminatedAt).toBe(firstTerminatedAt)
      })
    })
  })
})
