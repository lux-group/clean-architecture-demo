import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { Logger, TokenIssuerConfig } from "~/app/adapters"
import { SigningKeyRepository } from "~/domain/repositories"
import { shortToUUID } from "~/lib/ShortUUID"

export interface AuthorizeOptions {
  roles?: string[]
  scopes?: string[]
}

// The first wrapper function is used for dependency injection.
export function authorize(
  baseUrl: string,
  logger: Logger,
  tokenIssuerConfig: TokenIssuerConfig,
  signingKeyRepository: SigningKeyRepository,
) {
  // The second wrapper function is used by the decorator to inject arguments.
  return (options: AuthorizeOptions) => {
    // This is the actual middleware function.
    return (req: Request, res: Response, next: NextFunction) => {
      const authMiddleware = async () => {
        // Extract the token from the request headers.
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) {
          res.status(401).send()
          return
        }

        // Decode the JWT without verifying it.
        let decodedJwt: jwt.Jwt | null
        try {
          decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt | null
        } catch {
          logger.warn("Received invalid access token")
          res.status(401).send()
          return
        }

        // Ensure the decoded token is a structured JWT with headers/payload
        if (!decodedJwt || typeof decodedJwt === "string" || !decodedJwt.header || !decodedJwt.payload) {
          logger.warn("Received invalid access token")
          res.status(401).send()
          return
        }

        // Get the required validation key from the repository.
        const kid = decodedJwt.header.kid as string
        if (!kid) {
          logger.warn("Received access token without kid")
          res.status(401).send()
          return
        }

        const signingKey = await signingKeyRepository.tryGetById(shortToUUID(kid))
        if (!signingKey) {
          logger.warn(`Received access token with unknown kid ${kid}`)
          res.status(401).send()
          return
        }

        // Verify the token claims and signature.
        try {
          const options: jwt.VerifyOptions = {
            algorithms: ["RS256"],
            audience: tokenIssuerConfig.audience,
            issuer: baseUrl + tokenIssuerConfig.path,
          }

          jwt.verify(token, signingKey.publicKey, options)
        } catch (err) {
          logger.info("Access token verification failed. ", { error: err })
          res.status(401).send()
          return
        }

        // Check if the subject has the required roles.
        const rolesClaim = (decodedJwt.payload as JwtPayload).roles
        const authorizedRoles = Array.isArray(rolesClaim) ? rolesClaim : []
        if (options.roles && !options.roles.some(role => authorizedRoles.includes(role))) {
          logger.info(`Subject ${decodedJwt.payload.sub} does not have any of the roles: ${options.roles.join(", ")}`)
          res.status(403).send()
          return
        }

        // Check if the subject has the required scopes.
        const scopeClaim = (decodedJwt.payload as JwtPayload).scope
        const authorizedScopes = typeof scopeClaim === "string" ? scopeClaim.split(" ") : []
        if (options.scopes && !options.scopes.some(scope => authorizedScopes.includes(scope))) {
          logger.info(`Subject ${decodedJwt.payload.sub} does not have any of the scopes: ${options.scopes.join(", ")}`)
          res.status(403).send()
          return
        }

        next()
      }

      Promise.resolve(authMiddleware()).catch(next)
    }
  }
}
