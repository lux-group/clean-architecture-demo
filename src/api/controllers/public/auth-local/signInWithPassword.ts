import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import type { SignInWithPassword } from '~/application/use-cases/public/auth-local/SignInWithPassword';

export const signInWithPasswordSchema = {
  request: {
    body: z.object({
      email: z.email(),
      password: z.string().min(5).max(50),
      brand: z.string().min(5).max(50),
    }),
  },
  responses: {
    204: z.object().optional(),
    401: z.object({
      status: z.literal(401),
      message: z.string(),
    }),
  },
};

type RequestBody = z.infer<typeof signInWithPasswordSchema.request.body>;

export const signInWithPasswordHandler = (
  secureCookieManager: SecureCookieManager,
  signInWithPassword: SignInWithPassword,
) => {
  return async (req: Request<unknown, unknown, RequestBody>, res: Response) => {
    const command = {
      brand: req.body.brand,
      email: req.body.email,
      password: req.body.password,
    };

    const session = await signInWithPassword(command);
    secureCookieManager.setSessionCookie(req, res, session);
    res.status(204).send();
  };
};
