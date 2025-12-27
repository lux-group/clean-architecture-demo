import type { Request, Response } from 'express';
import z from 'zod';
import type { GetJsonWebKeysHandler } from '~/application/use-cases/public/token/GetJsonWebKeysHandler';

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

export const getJsonWebKeysHandler = (getJsonWebKeysHandler: GetJsonWebKeysHandler) => {
  return async (_req: Request, res: Response<ResponseBody>) => {
    const document = await getJsonWebKeysHandler.execute();
    res.json(document as ResponseBody);
  };
};
