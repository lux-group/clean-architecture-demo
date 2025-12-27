import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import type { CreateSignOutRequestHandler } from '~/application/use-cases/public/auth-external/CreateSignOutRequestHandler';
import { InvalidOperationError } from '~/domain/errors';
import { safeRedirect } from './shared';

export const createSignOutRequestSchema = {
  request: {
    query: z.object({
      redirect_uri: z.url(),
    }),
  },
  responses: {
    302: z.object().optional(),
    400: z.object({
      status: z.literal(400),
      message: z.string(),
    }),
  },
};

type RequestQuery = z.infer<typeof createSignOutRequestSchema.request.query>;

export const createSignOutRequestHandler = (
  secureCookieManager: SecureCookieManager,
  createSignOutRequestHandler: CreateSignOutRequestHandler,
) => {
  return async (req: Request<unknown, unknown, unknown, RequestQuery>, res: Response) => {
    const redirectUrl = req.query.redirect_uri;
    if (!redirectUrl) {
      throw new InvalidOperationError('Redirect URI parameter is required');
    }

    const cookie = secureCookieManager.getAndRemoveSessionCookie(req, res);

    const command = {
      sessionId: cookie.id,
      nonce: cookie.nonce,
      redirectUrl,
    };

    const request = await createSignOutRequestHandler.execute(command);
    if (request.signOutState) {
      secureCookieManager.setStateCookie(req, res, request.signOutState);
    }

    res.redirect(safeRedirect(request.url));
  };
};
