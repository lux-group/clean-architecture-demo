import * as factories from "@test/support/factories"
import { randomUUID } from "node:crypto"
import { User } from "~/domain/entities"
import { ConcurrencyError, NotFoundError, ValidationError } from "~/domain/errors"
import { PrismaUserRepository } from "../PrismaUserRepository"
import { createPrismaTestContext, PrismaTestContext } from "./helpers"

describe("PrismaUserRepository", () => {
  let testContext: PrismaTestContext
  let userRepository: PrismaUserRepository
  let identityProviderId: string

  const createUser = async (props: Partial<User> = {}, identities: number = 0): Promise<User> => {
    const user = factories.createUser(props)

    for (let i = 0; i < identities; i++) {
      user.addIdentity(identityProviderId, randomUUID())
    }

    await userRepository.insert(user)
    return user
  }

  beforeAll(async () => {
    testContext = await createPrismaTestContext()
    userRepository = new PrismaUserRepository(testContext.prismaClient)

    identityProviderId = randomUUID()

    await testContext.prismaClient.identityProvider.create({
      data: {
        id: identityProviderId,
        name: randomUUID(),
        issuerUrl: "https://test.example.com",
        audience: randomUUID(),
        identifierClaimName: "sub",
      }
    })
  })

  afterAll(async () => {
    await testContext.destroy()
  })

  describe("query", () => {
    it("should return all users", async () => {
      await createUser()

      const users = await userRepository.query()

      expect(users.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("getById", () => {
    it("should return user when found", async () => {
      const original = await createUser({}, 1)

      const found = await userRepository.getById(original.id)

      expect(found.id).toBe(original.id)
      expect(found.identities).toHaveLength(1)
      expect(found.identities[0].identityProviderId).toBe(identityProviderId)
    })

    it("should throw NotFoundError when user not found", async () => {
      await expect(userRepository.getById("non-existent-id"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetById", () => {
    it("should return user when found", async () => {
      const original = await createUser()

      const found = await userRepository.tryGetById(original.id)

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should return undefined when user not found", async () => {
      const found = await userRepository.tryGetById("non-existent-id")

      expect(found).toBeUndefined()
    })
  })

  describe("tryGetByBrandAndEmail", () => {
    it("should return user when found by brand and email", async () => {
      const original = await createUser()

      const found = await userRepository.tryGetByBrandAndEmail(original.brand, original.email)

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should return undefined when user not found", async () => {
      const found = await userRepository.tryGetByBrandAndEmail("non-existent-brand", "test@example.com")

      expect(found).toBeUndefined()
    })
  })

  describe("tryGetByExternalIdentity", () => {
    it("should return user when found by external identity", async () => {
      const original = await createUser({}, 1)

      const foundUser = await userRepository.tryGetByExternalIdentity(identityProviderId, original.identities[0].identifierClaimValue)

      expect(foundUser).toBeDefined()
      expect(foundUser!.identities).toHaveLength(1)
    })

    it("should return undefined when external identity not found", async () => {
      const foundUser = await userRepository.tryGetByExternalIdentity("non-existent-idp", "non-existent-user")

      expect(foundUser).toBeUndefined()
    })
  })

  describe("insert", () => {
    it("should insert a new user", async () => {
      const original = await createUser({}, 1)

      const remainingIdentities = await testContext.prismaClient.userIdentity.findMany({ where: { userId: original.id }})
      expect(remainingIdentities).toHaveLength(1)

      const insertedUser = await userRepository.getById(original.id)
      expect(insertedUser.props).toMatchObject(original.props)
    })

    it("should enforce unique brand/email constraint", async () => {
      const user = await createUser()

      await expect(userRepository.insert(user))
        .rejects
        .toThrow(ValidationError)      
    })
  })

  describe("update", () => {
    it("should update an existing user", async () => {
      const original = await createUser()

      original.update({
        isEnabled: false,
        givenName: "Johnny",
        surname: "Smith",
        country: "US",
        city: "New York",
        postcode: "10001",
        roles: ["admin"]
      })

      await userRepository.update(original)

      const updatedUser = await userRepository.getById(original.id)
      expect(updatedUser.props).toMatchObject(original.props)
    })

    it("should handle concurrent updates with optimistic locking", async () => {
      const original = await createUser()
      const user1 = new User({ ...original.props });
      const user2 = new User({ ...original.props });

      user1.update({
        isEnabled: true,
        givenName: user1.givenName,
        surname: user1.surname,
        country: null,
        city: null,
        postcode: null,
        roles: user1.roles
      })

      user2.update({
        isEnabled: true,
        givenName: user2.givenName,
        surname: user2.surname,
        country: null,
        city: null,
        postcode: null,
        roles: user1.roles
      })

      await userRepository.update(user1)

      await expect(userRepository.update(user2))
        .rejects
        .toThrow(ConcurrencyError)
    })
  })

  describe("delete", () => {
    it("should delete an existing user", async () => {
      const original = await createUser({}, 1)

      await userRepository.delete(original)

      const deletedUser = await userRepository.tryGetById(original.id)
      expect(deletedUser).toBeUndefined()

      const remainingIdentities = await testContext.prismaClient.userIdentity.findMany({ where: { userId: original.id }})
      expect(remainingIdentities).toHaveLength(0)
    })
  })
})
