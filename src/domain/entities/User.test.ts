import { AuthenticationError, InvalidOperationError, ValidationError, commonErrors } from "~/domain/errors"
import { Session } from "./Session"
import { CreateUserProps, UpdateUserProps, User } from "./User"

describe("User", () => {
  const mockCreateProps: CreateUserProps = {
    isEnabled: true,
    brand: "test-brand",
    givenName: "John",
    surname: "Doe",
    email: "john.doe@example.com",
    emailVerified: true,
    phone: "+1234567890",
    country: "US",
    city: "New York",
    postcode: "10001",
    passwordHash: "hashed-password",
    roles: ["user", "admin"],
  }

  const mockServiceAccountProps: CreateUserProps = {
    isEnabled: true,
    brand: "test-brand",
    givenName: "Service",
    surname: "Account",
    email: "service@example.com",
    emailVerified: true,
    phone: null,
    country: null,
    city: null,
    postcode: null,
    passwordHash: "hashed-secret",
    roles: ["service"],
  }

  const identityProviderId = "56d2a462-403f-4984-a839-d3044f99fb1d"

  describe("createNew", () => {
    it("should create a new User with generated properties", () => {
      const user = User.createNew(mockCreateProps)

      expect(user.id).toBeDefined()
      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
      expect(user.isEnabled).toBe(true)
      expect(user.identities).toEqual([])
      expect(user.brand).toBe(mockCreateProps.brand)
      expect(user.givenName).toBe(mockCreateProps.givenName)
      expect(user.surname).toBe(mockCreateProps.surname)
    })

    it("should create service account user", () => {
      const user = User.createNew(mockServiceAccountProps)

      expect(user.isServiceAccount).toBe(true)
      expect(user.roles).toContain("service")
    })

    it.each([
      { path: "givenName", value: null, error: "expected string" },
      { path: "givenName", value: "", error: "1 characters" },
      { path: "surname", value: null, error: "expected string" },
      { path: "surname", value: "", error: "1 characters" },
      { path: "email", value: null, error: "expected string" },
      { path: "email", value: "foo", error: "Invalid email" },
    ])("should throw a validation error when $path is $value", async ({ path, value, error }) => {
      try {
        User.createNew({ ...mockCreateProps, [path]: value })
        fail("Expected validation error to be thrown")
      } catch (thrownError: ValidationError | any) {
        expect(thrownError.errors).toBeDefined()
        expect(thrownError.errors[0].path).toContain(path)
        expect(thrownError.errors[0].message).toContain(error)
      }
    })
  })

  describe("computed properties", () => {
    describe("isServiceAccount", () => {
      it("should return true for users with service role", () => {
        const user = User.createNew(mockServiceAccountProps)

        expect(user.isServiceAccount).toBe(true)
      })

      it("should return false for users without service role", () => {
        const user = User.createNew(mockCreateProps)

        expect(user.isServiceAccount).toBe(false)
      })
    })

    describe("fullName", () => {
      it("should return formatted full name", () => {
        const user = User.createNew(mockCreateProps)

        expect(user.fullName).toBe("John Doe")
      })

      it("should format full name with different names", () => {
        const props = { ...mockCreateProps, givenName: "Jane", surname: "Smith" }
        const user = User.createNew(props)

        expect(user.fullName).toBe("Jane Smith")
      })
    })
  })

  describe("update", () => {
    it("should update allowed properties and set new updatedAt timestamp", () => {
      const user = User.createNew(mockCreateProps)
      const originalUpdatedAt = user.updatedAt

      const updateProps: UpdateUserProps = {
        isEnabled: false,
        givenName: "Jane",
        surname: "Smith",
        country: "CA",
        city: "Toronto",
        postcode: "M5V 3A8",
        roles: ["user"],
      }

      user.update(updateProps)

      expect(user.isEnabled).toBe(false)
      expect(user.givenName).toBe("Jane")
      expect(user.surname).toBe("Smith")
      expect(user.country).toBe("CA")
      expect(user.city).toBe("Toronto")
      expect(user.postcode).toBe("M5V 3A8")
      expect(user.roles).toEqual(["user"])
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())

      // Ensure non-updatable properties remain unchanged
      expect(user.brand).toBe(mockCreateProps.brand)
      expect(user.email).toBe(mockCreateProps.email)
      expect(user.passwordHash).toBe(mockCreateProps.passwordHash)
    })
  })

  describe("addIdentity", () => {
    it("should add new identity and clear password hash", () => {
      const user = User.createNew(mockCreateProps)

      user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "user-identifier")

      expect(user.identities).toHaveLength(1)
      expect(user.identities[0]).toEqual({
        id: expect.any(String),
        identityProviderId: "2ffa7325-4515-4859-a9dd-66902495ea5a",
        identifierClaimValue: "user-identifier",
      })
      expect(user.passwordHash).toBeNull()
    })

    it("should throw InvalidOperationError for duplicate identity provider", () => {
      const user = User.createNew(mockCreateProps)
      user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "user-identifier")

      expect(() => {
        user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "different-identifier")
      }).toThrow(InvalidOperationError)

      expect(() => {
        user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "different-identifier")
      }).toThrow(commonErrors.duplicateIdentity)
    })

    it("should allow multiple identities from different providers", () => {
      const user = User.createNew(mockCreateProps)

      user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "user-identifier-1")
      user.addIdentity("f1ff8ba2-6c18-4468-b310-dd51a85963fc", "user-identifier-2")

      expect(user.identities).toHaveLength(2)
      expect(user.identities[0].identityProviderId).toBe("2ffa7325-4515-4859-a9dd-66902495ea5a")
      expect(user.identities[1].identityProviderId).toBe("f1ff8ba2-6c18-4468-b310-dd51a85963fc")
    })
  })

  describe("changePassword", () => {
    it("should change password for user without identities", () => {
      const user = User.createNew(mockCreateProps)
      const newPasswordHash = "new-hashed-password"

      user.changePassword(newPasswordHash)

      expect(user.passwordHash).toBe(newPasswordHash)
    })

    it("should throw InvalidOperationError for user with identities", () => {
      const user = User.createNew(mockCreateProps)
      user.addIdentity("idp-123", "user-identifier")

      expect(() => {
        user.changePassword("new-password-hash")
      }).toThrow(InvalidOperationError)

      expect(() => {
        user.changePassword("new-password-hash")
      }).toThrow(commonErrors.passwordChangeNotAllowed)
    })
  })

  describe("authentication method checks", () => {
    describe("canSignInWithActiveSession", () => {
      it("should return true for enabled user", () => {
        const user = User.createNew(mockCreateProps)

        expect(user.canSignInWithActiveSession()).toBe(true)
      })

      it("should return false for disabled user", () => {
        const user = User.createNew(mockCreateProps)
        user.update({ ...mockCreateProps, isEnabled: false })

        expect(user.canSignInWithActiveSession()).toBe(false)
      })
    })

    describe("canSignInWithIdentityProvider", () => {
      it("should return true for enabled user with identities", () => {
        const user = User.createNew(mockCreateProps)
        user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "user-identifier")

        expect(user.canSignInWithIdentityProvider()).toBe(true)
      })

      it("should return false for disabled user with identities", () => {
        const user = User.createNew(mockCreateProps)
        user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "user-identifier")
        user.update({ ...mockCreateProps, isEnabled: false })

        expect(user.canSignInWithIdentityProvider()).toBe(false)
      })

      it("should return false for enabled user without identities", () => {
        const user = User.createNew(mockCreateProps)

        expect(user.canSignInWithIdentityProvider()).toBe(false)
      })
    })

    describe("canSignInWithPassword", () => {
      it("should return true for enabled non-service user without identities", () => {
        const user = User.createNew(mockCreateProps)

        expect(user.canSignInWithPassword()).toBe(true)
      })

      it("should return false for disabled user", () => {
        const user = User.createNew(mockCreateProps)
        user.update({ ...mockCreateProps, isEnabled: false })

        expect(user.canSignInWithPassword()).toBe(false)
      })

      it("should return false for user with identities", () => {
        const user = User.createNew(mockCreateProps)
        user.addIdentity("2ffa7325-4515-4859-a9dd-66902495ea5a", "user-identifier")

        expect(user.canSignInWithPassword()).toBe(false)
      })

      it("should return false for service account", () => {
        const user = User.createNew(mockServiceAccountProps)

        expect(user.canSignInWithPassword()).toBe(false)
      })
    })

    describe("canSignInWithClientSecret", () => {
      it("should return true for enabled service account without identities", () => {
        const user = User.createNew(mockServiceAccountProps)

        expect(user.canSignInWithClientSecret()).toBe(true)
      })

      it("should return false for disabled service account", () => {
        const user = User.createNew(mockServiceAccountProps)
        user.update({ ...mockServiceAccountProps, isEnabled: false })

        expect(user.canSignInWithClientSecret()).toBe(false)
      })

      it("should return false for service account with identities", () => {
        const user = User.createNew(mockServiceAccountProps)
        user.addIdentity("idp-123", "service-identifier")

        expect(user.canSignInWithClientSecret()).toBe(false)
      })

      it("should return false for non-service user", () => {
        const user = User.createNew(mockCreateProps)

        expect(user.canSignInWithClientSecret()).toBe(false)
      })
    })
  })

  describe("complex scenarios", () => {
    it("should handle user lifecycle: password -> identity provider", () => {
      // Start with password-based user
      const user = User.createNew(mockCreateProps)
      expect(user.canSignInWithPassword()).toBe(true)
      expect(user.canSignInWithIdentityProvider()).toBe(false)

      // Add identity (should clear password)
      user.addIdentity("idp-123", "user-identifier")
      expect(user.canSignInWithPassword()).toBe(false)
      expect(user.canSignInWithIdentityProvider()).toBe(true)
      expect(user.passwordHash).toBeNull()

      // Should not be able to change password
      expect(() => {
        user.changePassword("new-password")
      }).toThrow(InvalidOperationError)
    })

    it("should handle service account authentication", () => {
      const user = User.createNew(mockServiceAccountProps)
      
      expect(user.isServiceAccount).toBe(true)
      expect(user.canSignInWithClientSecret()).toBe(true)
      expect(user.canSignInWithPassword()).toBe(false)
      expect(user.canSignInWithIdentityProvider()).toBe(false)
    })
  })
})
