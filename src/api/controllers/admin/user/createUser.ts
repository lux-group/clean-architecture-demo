import type { Request, Response } from 'express';
import z from 'zod';
import type { ApiConfig } from '~/application/ports';
import type { CreateUser, CreateUserCommand } from '~/application/use-cases/admin/user/CreateUser';
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

export const createUserHandler = (apiConfig: ApiConfig, createUser: CreateUser) => {
  return async (req: Request<unknown, ResponseBody, RequestBody>, res: Response<ResponseBody>) => {
    const command = mapRequestToCommand(req.body);
    const item = await createUser(command);
    res
      .status(201)
      .header('Location', `${apiConfig.host}${apiConfig.adminBasePath}/users/${item.id}`)
      .json({
        status: 201,
        message: 'User created',
        result: presentUser(item),
      });
  };
};
