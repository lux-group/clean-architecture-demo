import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import type { CreateSignInRequestHandler } from '~/application/use-cases/public/auth-external/CreateSignInRequestHandler';
import { InvalidOperationError } from '~/domain/errors';
import { safeRedirect } from './shared';

export const createSignInRequestSchema = {
  request: {
    query: z.object({
      provider: z.string().min(5).max(50),
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

type RequestQuery = z.infer<typeof createSignInRequestSchema.request.query>;

export const createSignInRequestHandler = (
  secureCookieManager: SecureCookieManager,
  createSignInRequestHandler: CreateSignInRequestHandler,
) => {
  return async (req: Request<unknown, unknown, unknown, RequestQuery>, res: Response) => {
    const identityProviderName = req.query.provider;
    if (!identityProviderName) {
      throw new InvalidOperationError('Provider parameter is required');
    }

    const redirectUrl = req.query.redirect_uri;
    if (!redirectUrl) {
      throw new InvalidOperationError('Redirect URI parameter is required');
    }

    const command = {
      identityProviderName,
      redirectUrl,
    };

    const request = await createSignInRequestHandler.execute(command);
    secureCookieManager.setStateCookie(req, res, request.signInState);
    res.redirect(safeRedirect(request.url));
  };
};
