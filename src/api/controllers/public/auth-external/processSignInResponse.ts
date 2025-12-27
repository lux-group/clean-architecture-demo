import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import type { Logger, SignInState } from '~/application/ports';
import type { ProcessSignInResponseHandler } from '~/application/use-cases/public/auth-external/ProcessSignInResponseHandler';
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
  processSignInResponseHandler: ProcessSignInResponseHandler,
) => {
  return async (req: Request, res: Response) => {
    const signInState = secureCookieManager.getAndRemoveStateCookie<SignInState>(req, res);
    try {
      const command = {
        state: signInState,
        url: req.url,
      };

      const session = await processSignInResponseHandler.execute(command);
      secureCookieManager.setSessionCookie(req, res, session);
      res.redirect(safeRedirect(signInState.redirectUrl));
    } catch (err) {
      logger.error(err);
      res.redirect(safeRedirect(`${signInState.redirectUrl}?error=${encodeURIComponent(getErrorMessage(err))}`));
    }
  };
};
