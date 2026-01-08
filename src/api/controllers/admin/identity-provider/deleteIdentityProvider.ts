import type { Request, Response } from 'express';
import z from 'zod';
import type { DeleteIdentityProvider } from '~/application/use-cases/admin/identity-provider/DeleteIdentityProvider';

export const deleteIdentityProviderSchema = {
  request: {
    params: z.object({
      id: z.uuid(),
    }),
  },
  responses: {
    204: z.object({
      status: z.literal(204),
      message: z.string(),
    }),
    404: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestParams = z.infer<typeof deleteIdentityProviderSchema.request.params>;
type ResponseBody = z.infer<(typeof deleteIdentityProviderSchema.responses)['204']>;

export const deleteIdentityProviderHandler = (deleteIdentityProvider: DeleteIdentityProvider) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const command = { id: req.params.id };
    await deleteIdentityProvider(command);
    res.status(204).send({
      status: 204,
      message: 'Identity provider deleted',
    });
  };
};
