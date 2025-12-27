import type { Request, Response } from 'express';
import z from 'zod';
import { parseQuery } from '~/api/utils/parseQuery';
import type { SearchSigningKeysHandler } from '~/application/use-cases/admin/signing-key/SearchSigningKeysHandler';
import type { SigningKey } from '~/domain/entities';
import { presentSigningKey, signingKeySchema } from './shared';

export const searchSigningKeysSchema = {
  request: {},
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: z.array(signingKeySchema),
      total: z.int(),
    }),
  },
};

type ResponseBody = z.infer<(typeof searchSigningKeysSchema.responses)['200']>;

export const searchSigningKeysHandler = (searchSigningKeysHandler: SearchSigningKeysHandler) => {
  return async (req: Request<unknown, ResponseBody>, res: Response<ResponseBody>) => {
    const query = parseQuery<SigningKey>(req.query, ['createdAt']);
    const result = await searchSigningKeysHandler.execute(query);
    res.json({
      status: 200,
      message: `${result.total} Signing keys found`,
      result: result.items.map(item => presentSigningKey(item)),
      total: result.total,
    });
  };
};
