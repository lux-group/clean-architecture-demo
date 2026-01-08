import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import type { SignOut } from '~/application/use-cases/public/auth-local/SignOut';

export const signOutSchema = {
  request: {},
  responses: {
    204: z.object().optional(),
  },
};

export const signOutHandler = (secureCookieManager: SecureCookieManager, signOut: SignOut) => {
  return async (req: Request, res: Response) => {
    const cookie = secureCookieManager.getAndRemoveSessionCookie(req, res);

    const command = {
      sessionId: cookie.id,
      nonce: cookie.nonce,
    };

    await signOut(command);
    res.status(204).send();
  };
};
