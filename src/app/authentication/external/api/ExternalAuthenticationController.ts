import { Request, Response } from "express"
import { AuthenticationError, InvalidOperationError } from "~/domain/errors"
import { SignInState, SignOutState } from "~/domain/adapters"
import { SecureCookieManager } from "~/app/shared/utils/SecureCookieManager"
import { CreateSignInRequestCommand, CreateSignInRequestHandler } from "../commands/CreateSignInRequestHandler"
import { CreateSignOutRequestCommand, CreateSignOutRequestHandler } from "../commands/CreateSignOutRequestHandler"
import { ProcessSignInResponseCommand, ProcessSignInResponseHandler } from "../commands/ProcessSignInResponseHandler"
import { FrontChannelSignOutCommand, FrontChannelSignOutHandler } from "../commands/FrontChannelSignOutHandler"

export class ExternalAuthenticationController {
  constructor(
    private readonly secureCookieManager: SecureCookieManager,
    private readonly createSignInRequestHandler: CreateSignInRequestHandler,
    private readonly createSignOutRequestHandler: CreateSignOutRequestHandler,
    private readonly processSignInResponseHandler: ProcessSignInResponseHandler,
    private readonly frontChannelSignOutHandler: FrontChannelSignOutHandler,
  ) {}

  // TODO: What should we do if a user who already has active session tries to sign in
  // for some reason? Should we block the sign-in or just terminate the existing session?

  async createSignInRequest(req: Request, res: Response) {
    const command: CreateSignInRequestCommand = {
      identityProviderName: req.query.provider as string,
      redirectUrl: req.query.redirect_uri as string,
    }

    const request = await this.createSignInRequestHandler.execute(command)
    this.secureCookieManager.setStateCookie(req, res, request.signInState)
    res.redirect(request.url)
  }

  async processSignInResponse(req: Request, res: Response) {
    const signInState = this.secureCookieManager.getAndRemoveStateCookie<SignInState>(req, res)
    try {
      const command: ProcessSignInResponseCommand = {
        state: signInState,
        url: "/auth/external" + req.url
      }

      const session = await this.processSignInResponseHandler.execute(command)
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

    const command: CreateSignOutRequestCommand = {
      sessionId: cookie.id,
      nonce: cookie.nonce,
      redirectUrl: req.query.redirect_uri as string,
    }

    const request = await this.createSignOutRequestHandler.execute(command)
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
    const command: FrontChannelSignOutCommand = {
      sid: req.query.sid as string
    }
  
    await this.frontChannelSignOutHandler.execute(command)
    res.status(200).send()
  }

  private getErrorMessage(err: unknown) {
    if (err instanceof AuthenticationError || err instanceof InvalidOperationError)
      return err.message
    
    return "An unknown error occurred. Please try again."
  }
}
