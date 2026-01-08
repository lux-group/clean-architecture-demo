import type { Request, Response } from 'express';
import z from 'zod';
import type { GetJsonWebKeys } from '~/application/use-cases/public/token/GetJsonWebKeys';

export const getJsonWebKeysSchema = {
  request: {},
  responses: {
    200: z.object({
      keys: z.array(
        z.object({
          kty: z.string(),
          use: z.string(),
          kid: z.string(),
          n: z.string(),
          e: z.string(),
        }),
      ),
    }),
  },
};

type ResponseBody = z.infer<(typeof getJsonWebKeysSchema.responses)['200']>;

export const getJsonWebKeysHandler = (getJsonWebKeys: GetJsonWebKeys) => {
  return async (_req: Request, res: Response<ResponseBody>) => {
    const document = await getJsonWebKeys();
    res.json(document as ResponseBody);
  };
};
