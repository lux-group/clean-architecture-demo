import jwt, { JwtPayload } from "jsonwebtoken"
import { NextFunction, Request, Response } from "express";

// DEMO middleware to authorize requests based on JWT scopes
// Note that this does not verify the JWT signature or issuer.

export interface AuthorizeOptions {
  roles?: string[];
  scopes?: string[];
  audiences?: string[];
}

export function authorize(options: AuthorizeOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authMiddleware = async () => {
      // const token = req.headers.authorization?.split(" ")[0]
      // if (!token) {
      //   res.status(401).send()
      //   return
      // }

      // let audience: string | undefined
      // let scope: string | undefined
      // try {
      //   const decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt
      //   audience = (decodedJwt.payload as JwtPayload).aud as string
      //   scope = (decodedJwt.payload as JwtPayload).scope
      // } catch {
      //   res.status(401).send()
      //   return
      // }

      // if (requiredAudience && audience !== requiredAudience) {
      //   res.status(403).send()
      //   return
      // }

      // if (!scope || !scope.split(" ").includes(requiredScope)) {
      //   res.status(403).send()
      //   return
      // }

      next()
    }

    Promise.resolve(authMiddleware()).catch(next)
  }
}
