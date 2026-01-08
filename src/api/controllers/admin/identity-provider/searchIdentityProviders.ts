import type { Request, Response } from 'express';
import z from 'zod';
import { parseQuery } from '~/api/utils/parseQuery';
import type { SearchIdentityProviders } from '~/application/use-cases/admin/identity-provider/SearchIdentityProviders';
import type { IdentityProvider } from '~/domain/entities';
import { identityProviderSchema, presentIdentityProvider } from './shared';

export const searchIdentityProvidersSchema = {
  request: {
    // No params for collection search
  },
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: z.array(identityProviderSchema),
      total: z.int(),
    }),
  },
};

type ResponseBody = z.infer<(typeof searchIdentityProvidersSchema.responses)['200']>;

export const searchIdentityProvidersHandler = (searchIdentityProviders: SearchIdentityProviders) => {
  return async (req: Request<unknown, ResponseBody>, res: Response<ResponseBody>) => {
    const query = parseQuery<IdentityProvider>(req.query, ['createdAt', 'name'], ['name']);
    const result = await searchIdentityProviders(query);
    res.json({
      status: 200,
      message: `${result.total} Identity providers found`,
      result: result.items.map(item => presentIdentityProvider(item)),
      total: result.total,
    });
  };
};
