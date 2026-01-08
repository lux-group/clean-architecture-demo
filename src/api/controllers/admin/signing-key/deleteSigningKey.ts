import type { Request, Response } from 'express';
import z from 'zod';
import type { DeleteSigningKey } from '~/application/use-cases/admin/signing-key/DeleteSigningKey';

export const deleteSigningKeySchema = {
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

type RequestParams = z.infer<typeof deleteSigningKeySchema.request.params>;
type ResponseBody = z.infer<(typeof deleteSigningKeySchema.responses)['204']>;

export const deleteSigningKeyHandler = (deleteSigningKey: DeleteSigningKey) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const command = { id: req.params.id };
    await deleteSigningKey(command);
    res.status(204).send({
      status: 204,
      message: 'Signing key deleted',
    });
  };
};
