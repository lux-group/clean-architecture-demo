import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import type { Logger, SignInState } from '~/application/ports';
import type { ProcessSignInResponse } from '~/application/use-cases/public/auth-external/ProcessSignInResponse';
import { getErrorMessage, safeRedirect } from './shared';

export const processSignInResponseSchema = {
  request: {},
  responses: {
    302: z.object().optional(),
  },
};

export const processSignInResponseHandler = (
  logger: Logger,
  secureCookieManager: SecureCookieManager,
  processSignInResponse: ProcessSignInResponse,
) => {
  return async (req: Request, res: Response) => {
    const signInState = secureCookieManager.getAndRemoveStateCookie<SignInState>(req, res);
    try {
      const command = {
        state: signInState,
        url: req.url,
      };

      const session = await processSignInResponse(command);
      secureCookieManager.setSessionCookie(req, res, session);
      res.redirect(safeRedirect(signInState.redirectUrl));
    } catch (err) {
      logger.error(err);
      res.redirect(safeRedirect(`${signInState.redirectUrl}?error=${encodeURIComponent(getErrorMessage(err))}`));
    }
  };
};
