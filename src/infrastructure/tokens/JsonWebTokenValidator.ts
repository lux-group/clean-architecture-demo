import jwt, { JwtHeader, JwtPayload } from "jsonwebtoken"
import { JwksClient, SigningKey } from "jwks-rsa"
import { TokenValidationResult, TokenValidator } from "~/app/ports"
import { IdentityProvider } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"
import { IdentityProviderRepository } from "~/domain/repositories"
import { ClientCache } from "~/lib/ClientCache"

// Cache instance for JWKS clients.
const jwksClientCache = new ClientCache<IdentityProvider, JwksClient>(async idp => {
  const url = `${idp.issuerUrl}/.well-known/openid-configuration`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to retrieve OIDC metadata from ${url}. HTTP error ${response.status}`)
  }

  const metadata = await response.json()
  return new JwksClient({ jwksUri: metadata.jwks_uri })
})

export class JsonWebTokenValidator implements TokenValidator {
  constructor(private readonly identityProviderRepository: IdentityProviderRepository) {}

  async decodeAndValidateToken(token: string): Promise<TokenValidationResult> {
    let headerClaims: JwtHeader
    let bodyClaims: JwtPayload

    try {
      const decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt
      headerClaims = decodedJwt.header
      bodyClaims = decodedJwt.payload as JwtPayload
    } catch {
      throw AuthenticationError.tokenExchangeFailed(undefined, undefined, "Failed to decode JWT")
    }

    const { iss, aud, sub } = bodyClaims
    if (!iss || !aud || !sub) {
      throw AuthenticationError.tokenExchangeFailed(undefined, undefined, "JWT missing required claims")
    }

    const identityProvider = await this.identityProviderRepository.tryGetByIssuerUrlAndAudience(iss, aud as string)
    if (!identityProvider) {
      throw AuthenticationError.tokenExchangeFailed(undefined, undefined, "Identitiy provider not found")
    }

    let signingKey: SigningKey
    try {
      const client = await jwksClientCache.get(identityProvider)
      signingKey = await client.getSigningKey(headerClaims.kid)
    } catch {
      throw new Error("Unable to fetch JWKS document.")
    }

    try {
      jwt.verify(token, signingKey.getPublicKey())
    } catch {
      throw AuthenticationError.tokenExchangeFailed(identityProvider.id, undefined, "Failed to validate JWT")
    }

    const profile = {
      email: bodyClaims.email as string,
      givenName: bodyClaims.given_name as string,
      surname: bodyClaims.family_name as string,
      identifierClaimValue: bodyClaims[identityProvider.identifierClaimName] as string,
    }

    return { identityProvider, profile }
  }
}
