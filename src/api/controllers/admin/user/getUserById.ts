import type { Request, Response } from 'express';
import z from 'zod';
import type { GetUserById } from '~/application/use-cases/admin/user/GetUserById';
import { presentUser, userSchema } from './shared';

export const getUserByIdSchema = {
  request: {
    params: z.object({
      id: z.uuid(),
    }),
  },
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: userSchema,
    }),
    404: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestParams = z.infer<typeof getUserByIdSchema.request.params>;
type ResponseBody = z.infer<(typeof getUserByIdSchema.responses)['200']>;

export const getUserByIdHandler = (getUserById: GetUserById) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const query = { id: req.params.id };
    const item = await getUserById(query);
    res.json({
      status: 200,
      message: 'User found',
      result: presentUser(item),
    });
  };
};
