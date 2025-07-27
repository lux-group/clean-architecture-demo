import { Request, Response } from "express"
import { SignInWithPasswordUseCase, SignOutUseCase } from "~/application/authentication/local"
import { SecureCookieManager } from "~/api/utils/SecureCookieManager"

export class LocalAuthenticationController {
  constructor(
    private readonly secureCookieManager: SecureCookieManager,
    private readonly signInWithPasswordUseCase: SignInWithPasswordUseCase,
    private readonly signOutUseCase: SignOutUseCase,
  ) {}

  // TODO: What should we do if a user who already has active session tries to sign in
  // for some reason? Should we block the sign-in or just terminate the existing session?

  async signInWithPassword(req: Request, res: Response) {
    const input = {
      brand: req.body?.brand,
      email: req.body?.email,
      password: req.body?.password
    }

    const session = await this.signInWithPasswordUseCase.execute(input)
    this.secureCookieManager.setSessionCookie(req, res, session)
    res.status(204).send()
  }

  async signOut(req: Request, res: Response) {
    const cookie = this.secureCookieManager.getAndRemoveSessionCookie(req, res)

    const input = {
      sessionId: cookie.id,
      nonce: cookie.nonce
    }
    
    await this.signOutUseCase.execute(input)
    res.status(204).send()
  }
}
