import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import type { SignOutState } from '~/application/ports';
import { safeRedirect } from './shared';

export const processSignOutResponseSchema = {
  request: {},
  responses: {
    302: z.object().optional(),
  },
};

export const processSignOutResponseHandler = (secureCookieManager: SecureCookieManager) => {
  return async (req: Request, res: Response) => {
    const signOutState = secureCookieManager.getAndRemoveStateCookie<SignOutState>(req, res);
    res.redirect(safeRedirect(signOutState.redirectUrl));
  };
};
