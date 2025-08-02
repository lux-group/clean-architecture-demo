import { randomUUID } from "node:crypto"
import {
  CreateIdentityProviderProps,
  CreateSessionProps,
  CreateSigningKeyProps,
  CreateUserProps,
  IdentityProvider,
  Session,
  SigningKey,
  User
} from "~/domain/entities"

export function createIdentityProvider(props: Partial<CreateIdentityProviderProps> = {}) {
  return IdentityProvider.createNew({
    name: randomUUID(),
    issuerUrl: "https://login.test.com",
    audience: randomUUID(),
    identifierClaimName: "sub",
    ...props,
    authSettings: {
      type: "ENTRA",
      brand: "Test Brand",
      clientId: randomUUID(),
      clientSecret: randomUUID(),
      redirectUrls: ["https://test.example.com"],
      autoLinkUsers: true,
      autoCreateUsers: true,
      ...props.authSettings,
    }
  })
}

export function createUser(props: Partial<CreateUserProps> = {}) {
  const user = User.createNew({
    isEnabled: true,
    brand: "Test Brand",
    givenName: randomUUID(),
    surname: randomUUID(),
    email: `${randomUUID()}@example.com`,
    emailVerified: false,
    phone: null,
    country: null,
    city: null,
    postcode: null,
    passwordHash: null,
    roles: [],
    ...props,
  })

  return user
}

export function createLocalSession(props: Partial<CreateSessionProps> = {}, hours: number = 1) {
  return Session.createNew({
    userId: randomUUID(),
    identityProviderId: null,
    identityProviderSessionId: null,
    idToken: null,
    refreshToken: null,
    ...props,
  }, hours)
}

export function createIdentityProviderSession(props: Partial<CreateSessionProps> = {}, hours: number = 1) {
  return Session.createNew({
    userId: randomUUID(),
    identityProviderId: randomUUID(),
    identityProviderSessionId: randomUUID(),
    idToken: randomUUID(),
    refreshToken: randomUUID(),
    ...props,
  }, hours)
}

export function createSigningKey(props: Partial<CreateSigningKeyProps> = {}) {
  return SigningKey.createNew({
    publicKey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAq4qFgibwtEd49x2momIF
ktJR/iKmishVYFDy5YBB02jQQljee7FiAJv6F5LMQ9U1AKeTraBB3SDeeM1iXxob
BeQjORQK3+Et3jgLERb8Qw4kM8lKmsxEvaFSLpx4pdEBWTwCN7dlZFRHNRHxVGmA
LazXXA8o6+X9SZXvImiOiIYQ4bvSojNJKq1mthteve/E2DNd4T5QC2LV+1gkCeSO
1vrRa9EmiHhis3aoTogbJkm3q97X3JkzbpB6MhDWHkrXLx90zJ6+bbnmNQ8cSeuU
IhAaXSyVR0Ql39xUoU50nB0Br5aiSMH4fByS8pU4/nz3s/oRKPEl2rmvWfYmPfkY
XEVHcHI/tHiL+A0F50r+fG8VJf3HEw3XRVXWeDWoDXCcFthj50BsXWMr5LHDabXD
h/pk22Jq6B6lH3nnafYZ50nZMt1Noo3edCWY61KjLOdtbl2/ZgDIBAvHhc3mIcat
iRvhqET9bNOHTYHtu5pGRXcQ4n23Ls28p9FNsM/n8K57dzKaikbg7+tHP4FUoQZK
mMJ99vLQJGcRHmTLIWBRp5ORi1R7AiEd52703DPEwDroqucPUDsqlhsLCLru/ftD
vwefLB+xlrS4w5qwSa9fqjT/rLIMesH4zrTni6bCFzT2AO826UutiPnv2B1lIirO
oDZjx6Ibok1NjM+v80PGYgMCAwEAAQ==
-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----
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
+J+J5qrEmZcwEV0VV3WSOY0ezUUoIy8=
-----END PRIVATE KEY-----`,
  ...props})
}
