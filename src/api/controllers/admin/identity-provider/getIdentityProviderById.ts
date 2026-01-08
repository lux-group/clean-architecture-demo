import type { Request, Response } from 'express';
import z from 'zod';
import type { GetIdentityProviderById } from '~/application/use-cases/admin/identity-provider/GetIdentityProviderById';
import { identityProviderSchema, presentIdentityProvider } from './shared';

export const getIdentityProviderByIdSchema = {
  request: {
    params: z.object({
      id: z.uuid(),
    }),
  },
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: identityProviderSchema,
    }),
    404: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestParams = z.infer<typeof getIdentityProviderByIdSchema.request.params>;
type ResponseBody = z.infer<(typeof getIdentityProviderByIdSchema.responses)['200']>;

export const getIdentityProviderByIdHandler = (getIdentityProviderById: GetIdentityProviderById) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const query = { id: req.params.id };
    const item = await getIdentityProviderById(query);
    res.json({
      status: 200,
      message: 'Identity provider found',
      result: presentIdentityProvider(item),
    });
  };
};
