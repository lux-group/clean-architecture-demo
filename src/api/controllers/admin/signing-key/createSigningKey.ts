import type { Request, Response } from 'express';
import z from 'zod';
import type { CreateNewSigningKeyHandler } from '~/application/use-cases/admin/signing-key/CreateNewSigningKeyHandler';
import { presentSigningKey, signingKeySchema } from './shared';

export const createSigningKeySchema = {
  request: {},
  responses: {
    201: z.object({
      status: z.literal(201),
      message: z.string(),
      result: signingKeySchema,
    }),
  },
};

type ResponseBody = z.infer<(typeof createSigningKeySchema.responses)['201']>;

export const createSigningKeyHandler = (baseUrl: string, createNewSigningKeyHandler: CreateNewSigningKeyHandler) => {
  return async (_req: Request<unknown, ResponseBody>, res: Response<ResponseBody>) => {
    const item = await createNewSigningKeyHandler.execute();
    res
      .status(201)
      .header('Location', `${baseUrl}/admin/v2/signing-keys/${item.id}`)
      .json({
        status: 201,
        message: 'Signing key created',
        result: presentSigningKey(item),
      });
  };
};
