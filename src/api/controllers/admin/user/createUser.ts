import type { Request, Response } from 'express';
import z from 'zod';
import type { CreateUserCommand, CreateUserHandler } from '~/application/use-cases/admin/user/CreateUserHandler';
import { MapperBuilder } from '~/lib/MapperBuilder';
import { presentUser, userSchema } from './shared';

export const createUserSchema = {
  request: {
    body: userSchema
      .omit({
        id: true,
        created_at: true,
        updated_at: true,
        email_verified: true,
        identities: true,
      })
      .extend({
        password: z.string(),
      }),
  },
  responses: {
    201: z.object({
      status: z.literal(201),
      message: z.string(),
      result: userSchema,
    }),
    400: z.object({
      status: z.literal(400),
      message: z.string(),
    }),
  },
};

type RequestBody = z.infer<typeof createUserSchema.request.body>;
type ResponseBody = z.infer<(typeof createUserSchema.responses)['201']>;

const mapRequestToCommand = MapperBuilder.for<RequestBody>().toCamelCase().build<CreateUserCommand>();

export const createUserHandler = (baseUrl: string, createUserHandler: CreateUserHandler) => {
  return async (req: Request<unknown, ResponseBody, RequestBody>, res: Response<ResponseBody>) => {
    const command = mapRequestToCommand(req.body);
    const item = await createUserHandler.execute(command);
    res
      .status(201)
      .header('Location', `${baseUrl}/admin/v2/users/${item.id}`)
      .json({
        status: 201,
        message: 'User created',
        result: presentUser(item),
      });
  };
};
