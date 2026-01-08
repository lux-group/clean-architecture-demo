import type { Request, Response } from 'express';
import z from 'zod';
import type { GetOpenidConfiguration } from '~/application/use-cases/public/token/GetOpenidConfiguration';

export const getOpenidConfigurationSchema = {
  request: {},
  responses: {
    200: z.object({
      issuer: z.string(),
      jwks_uri: z.string(),
      token_endpoint: z.string(),
      response_types_supported: z.array(z.string()),
      subject_types_supported: z.array(z.string()),
      id_token_signing_alg_values_supported: z.array(z.string()),
    }),
  },
};

type ResponseBody = z.infer<(typeof getOpenidConfigurationSchema.responses)['200']>;

export const getOpenidConfigurationHandler = (getOpenidConfiguration: GetOpenidConfiguration) => {
  return async (_req: Request, res: Response<ResponseBody>) => {
    const document = await getOpenidConfiguration();
    res.json(document as ResponseBody);
  };
};
