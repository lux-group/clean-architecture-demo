import jwt, { JwtPayload } from "jsonwebtoken"
import { NextFunction, Request, Response } from "express"
import { Logger } from "~/infrastructure/logging"

export interface AuthorizeOptions {
  roles?: string[]
  scopes?: string[]
  audiences?: string[]
}

// The first wrapper function is used for dependency injection.
export function authorize(logger: Logger) {
  // The second wrapper function is used by the decorator to inject arguments.
  return (options: AuthorizeOptions) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const authMiddleware = async () => {
        console.log(req.headers.authorization) 
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) {
          res.status(401).send()
          return
        }

        let audience: string | undefined
        let scopes: string[] = []
        let roles: string[] = []
        try {
          const decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt
          audience = (decodedJwt.payload as JwtPayload).aud as string
          scopes = (decodedJwt.payload as JwtPayload).scope.split(" ")
          roles = (decodedJwt.payload as JwtPayload).roles
        } catch {
          res.status(401).send()
          return
        }

        if (options.audiences && !options.audiences.includes(audience)) {
          res.status(403).send()
          return
        }

        if (options.roles && !options.roles.some(role => roles.includes(role))) {
          res.status(403).send()
          return
        }

        if (options.scopes && !options.scopes.some(scope => scopes.includes(scope))) {
          res.status(403).send()
          return
        }

        next()
      }

      Promise.resolve(authMiddleware()).catch(next)
    }
  }
}
