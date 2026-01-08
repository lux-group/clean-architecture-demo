import type { Request, Response } from 'express';
import z from 'zod';
import type { DeleteUser } from '~/application/use-cases/admin/user/DeleteUser';

export const deleteUserSchema = {
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

type RequestParams = z.infer<typeof deleteUserSchema.request.params>;
type ResponseBody = z.infer<(typeof deleteUserSchema.responses)['204']>;

export const deleteUserHandler = (deleteUser: DeleteUser) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const command = { id: req.params.id };
    await deleteUser(command);
    res.status(204).send({
      status: 204,
      message: 'User deleted',
    });
  };
};
