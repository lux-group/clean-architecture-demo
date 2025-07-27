import { AwilixContainer } from "awilix"
import { CreateNewSigningKeyUseCase } from "~/application/admin/signing-key"
import { CreateIdentityProviderUseCase } from "~/application/admin/identity-provider"
import { IdentityProviderType } from "~/domain/entities"

export default async function createTestData(container: AwilixContainer) {
  const createNewSigningKeyUseCase = container.resolve<CreateNewSigningKeyUseCase>("createNewSigningKeyUseCase")
  const createIdentityProviderUseCase = container.resolve<CreateIdentityProviderUseCase>("createIdentityProviderUseCase")
  const baseUrl = container.resolve<string>("baseUrl")

  // Create a test signing key.
  await createNewSigningKeyUseCase.execute()

  // Register test Entra ID tenant for authentication.
  await createIdentityProviderUseCase.execute({
    name: "Entra",
    issuerUrl: "https://b690daea-2aad-4dee-bdbf-0a66220e5977.ciamlogin.com/b690daea-2aad-4dee-bdbf-0a66220e5977/v2.0",
    audience: "b926e720-2d57-443a-be2f-d4b13ae36515",
    identifierClaimName: "oid",
    authSettings: {
      type: IdentityProviderType.Entra,
      brand: "Test Brand",
      clientId: "b926e720-2d57-443a-be2f-d4b13ae36515",
      clientSecret: "o7C8Q~jQbRzi5KJdm_m98DYAQs9p_esZ7JshNcZV", // Secret stored in repo because it's an empty test tenant.
      redirectUrls: [baseUrl],
      autoLinkUsers: true,
      autoCreateUsers: true
    }
  })

  // Register test Google app for authentication.
  await createIdentityProviderUseCase.execute({
    name: "Google",
    issuerUrl: "https://accounts.google.com",
    audience: "329419931200-9godclu5b1sgdjtgllmcbptc03scqfns.apps.googleusercontent.com",
    identifierClaimName: "sub",
    authSettings: {
      type: IdentityProviderType.Google,
      brand: "Test Brand",
      clientId: "329419931200-9godclu5b1sgdjtgllmcbptc03scqfns.apps.googleusercontent.com",
      clientSecret: "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",
      redirectUrls: [baseUrl],
      autoLinkUsers: true,
      autoCreateUsers: true
    }
  })

  // Register GitHub for token exchange (unused).
  await createIdentityProviderUseCase.execute({
    name: "GitHub",
    issuerUrl: "https://token.actions.githubusercontent.com",
    audience: "api://TokenExchange",
    identifierClaimName: "sub",
    authSettings: null
  })

  // Register CircleCI for token exchange (unused).
  await createIdentityProviderUseCase.execute({
    name: "CircleCI",
    issuerUrl: "https://oidc.circleci.com/org/dcde7526-36e2-4073-9b73-d3d684c57e1a",
    audience: "dcde7526-36e2-4073-9b73-d3d684c57e1a",
    identifierClaimName: "sub",
    authSettings: null
  })
}
