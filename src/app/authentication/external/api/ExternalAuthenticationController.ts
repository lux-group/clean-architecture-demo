import { Request, Response } from "express"
import { AuthenticationError, InvalidOperationError } from "~/domain/errors"
import { SignInState, SignOutState } from "~/domain/adapters"
import { SecureCookieManager } from "~/app/shared/utils/SecureCookieManager"
import { CreateSignInRequestUseCase } from "../use-cases/CreateSignInRequestUseCase"
import { CreateSignOutRequestUseCase } from "../use-cases/CreateSignOutRequestUseCase"
import { ProcessSignInResponseUseCase } from "../use-cases/ProcessSignInResponseUseCase"
import { FrontChannelSignOutUseCase } from "../use-cases/FrontChannelSignOutUseCase"

export class ExternalAuthenticationController {
  constructor(
    private readonly secureCookieManager: SecureCookieManager,
    private readonly createSignInRequestUseCase: CreateSignInRequestUseCase,
    private readonly createSignOutRequestUseCase: CreateSignOutRequestUseCase,
    private readonly processSignInResponseUseCase: ProcessSignInResponseUseCase,
    private readonly frontChannelSignOutUseCase: FrontChannelSignOutUseCase,
  ) {}

  // TODO: What should we do if a user who already has active session tries to sign in
  // for some reason? Should we block the sign-in or just terminate the existing session?

  async createSignInRequest(req: Request, res: Response) {
    const input = {
      identityProviderName: req.query.provider as string,
      redirectUrl: req.query.redirect_uri as string,
    }

    const request = await this.createSignInRequestUseCase.execute(input)
    this.secureCookieManager.setStateCookie(req, res, request.signInState)
    res.redirect(request.url)
  }

  async processSignInResponse(req: Request, res: Response) {
    const signInState = this.secureCookieManager.getAndRemoveStateCookie<SignInState>(req, res)
    try {
      const input = { state: signInState, url: "/auth/external" + req.url }
      const session = await this.processSignInResponseUseCase.execute(input)
      this.secureCookieManager.setSessionCookie(req, res, session)
      res.redirect(signInState.redirectUrl)
    }
    catch (err) {
      console.error(err)
      res.redirect(signInState.redirectUrl + "?error=" + encodeURIComponent(this.getErrorMessage(err)))
    }
  }

  async createSignOutRequest(req: Request, res: Response) {
    const cookie = this.secureCookieManager.getAndRemoveSessionCookie(req, res)
    
    const input = {
      sessionId: cookie.id,
      nonce: cookie.nonce,
      redirectUrl: req.query.redirect_uri as string,
    }

    const request = await this.createSignOutRequestUseCase.execute(input)
    if (request.signOutState) {
      this.secureCookieManager.setStateCookie(req, res, request.signOutState)
    }

    res.redirect(request.url)
  }

  async processSignOutResponse(req: Request, res: Response) {
    const signOutState = this.secureCookieManager.getAndRemoveStateCookie<SignOutState>(req, res)
    res.redirect(signOutState.redirectUrl)
  }

  async frontChannelSignOut(req: Request, res: Response) {
    const input = { sid: req.query.sid as string }
    await this.frontChannelSignOutUseCase.execute(input)
    res.status(200).send()
  }

  private getErrorMessage(err: unknown) {
    if (err instanceof AuthenticationError || err instanceof InvalidOperationError)
      return err.message
    
    return "An unknown error occurred. Please try again."
  }
}
