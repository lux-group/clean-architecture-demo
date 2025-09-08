import { Request, Response } from "express"
import { Controller, HandleDomainErrors, Post } from "~/app/routing"
import { SecureCookieManager } from "~/app/shared/utils/SecureCookieManager"
import { SignInWithPasswordCommand, SignInWithPasswordHandler } from "../commands/SignInWithPasswordHandler"
import { SignOutCommand, SignOutHandler } from "../commands/SignOutHandler"

@Controller("/auth/v2/local")
@HandleDomainErrors({ format: "Standard" })
export class LocalAuthenticationController {
  constructor(
    private readonly secureCookieManager: SecureCookieManager,
    private readonly signInWithPasswordHandler: SignInWithPasswordHandler,
    private readonly signOutHandler: SignOutHandler,
  ) {}

  // TODO: What should we do if a user who already has active session tries to sign in
  // for some reason? Should we block the sign-in or just terminate the existing session?

  @Post("/sign-in")
  async signInWithPassword(req: Request, res: Response) {
    const command: SignInWithPasswordCommand = {
      brand: req.body?.brand,
      email: req.body?.email,
      password: req.body?.password,
    }

    const session = await this.signInWithPasswordHandler.execute(command)
    this.secureCookieManager.setSessionCookie(req, res, session)
    res.status(204).send()
  }

  @Post("/sign-out")
  async signOut(req: Request, res: Response) {
    const cookie = this.secureCookieManager.getAndRemoveSessionCookie(req, res)

    const command: SignOutCommand = {
      sessionId: cookie.id,
      nonce: cookie.nonce,
    }

    await this.signOutHandler.execute(command)
    res.status(204).send()
  }
}
