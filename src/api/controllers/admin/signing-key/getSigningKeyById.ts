import type { Request, Response } from 'express';
import z from 'zod';
import type { GetSigningKeyById } from '~/application/use-cases/admin/signing-key/GetSigningKeyById';
import { presentSigningKey, signingKeySchema } from './shared';

export const getSigningKeyByIdSchema = {
  request: {
    params: z.object({
      id: z.uuid(),
    }),
  },
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: signingKeySchema,
    }),
    404: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestParams = z.infer<typeof getSigningKeyByIdSchema.request.params>;
type ResponseBody = z.infer<(typeof getSigningKeyByIdSchema.responses)['200']>;

export const getSigningKeyByIdHandler = (getSigningKeyById: GetSigningKeyById) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const query = { id: req.params.id };
    const item = await getSigningKeyById(query);
    res.json({
      status: 200,
      message: 'Signing key found',
      result: presentSigningKey(item),
    });
  };
};
