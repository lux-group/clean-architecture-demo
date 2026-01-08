import type { Request, Response } from 'express';
import z from 'zod';
import type { UpdateUser, UpdateUserCommand } from '~/application/use-cases/admin/user/UpdateUser';
import { MapperBuilder } from '~/lib/MapperBuilder';
import { presentUser, userSchema } from './shared';

export const updateUserSchema = {
  request: {
    params: z.object({
      id: z.uuid(),
    }),
    body: userSchema.omit({
      id: true,
      created_at: true,
      updated_at: true,
      brand: true,
      email: true,
      email_verified: true,
      phone: true,
      identities: true,
    }),
  },
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: userSchema,
    }),
    400: z.object({
      status: z.literal(400),
      message: z.string(),
    }),
    404: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestParams = z.infer<typeof updateUserSchema.request.params>;
type RequestBody = z.infer<typeof updateUserSchema.request.body>;
type ResponseBody = z.infer<(typeof updateUserSchema.responses)['200']>;

const mapRequestToCommand = MapperBuilder.for<RequestBody>().toCamelCase().build<UpdateUserCommand>();

export const updateUserHandler = (updateUser: UpdateUser) => {
  return async (req: Request<RequestParams, ResponseBody, RequestBody>, res: Response<ResponseBody>) => {
    const command = {
      id: req.params.id,
      ...mapRequestToCommand(req.body),
    };
    const item = await updateUser(command);
    res.json({
      status: 200,
      message: 'User updated',
      result: presentUser(item),
    });
  };
};
