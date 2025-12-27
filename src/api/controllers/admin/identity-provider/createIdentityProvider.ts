import type { Request, Response } from 'express';
import z from 'zod';
import type {
  CreateIdentityProvider,
  CreateIdentityProviderCommand,
} from '~/application/use-cases/admin/identity-provider/CreateIdentityProvider';
import { MapperBuilder } from '~/lib/MapperBuilder';
import { identityProviderSchema, presentIdentityProvider } from './shared';

export const createIdentityProviderSchema = {
  request: {
    body: identityProviderSchema.omit({
      id: true,
      created_at: true,
      updated_at: true,
    }),
  },
  responses: {
    201: z.object({
      status: z.literal(201),
      message: z.string(),
      result: identityProviderSchema,
    }),
    400: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestBody = z.infer<typeof createIdentityProviderSchema.request.body>;
type ResponseBody = z.infer<(typeof createIdentityProviderSchema.responses)['201']>;

const mapRequestToCommand = MapperBuilder.for<RequestBody>().toCamelCase().build<CreateIdentityProviderCommand>();

export const createIdentityProviderHandler = (baseUrl: string, createIdentityProvider: CreateIdentityProvider) => {
  return async (req: Request<unknown, ResponseBody, RequestBody>, res: Response<ResponseBody>) => {
    const command = mapRequestToCommand(req.body);
    const item = await createIdentityProvider(command);
    res
      .status(201)
      .header('Location', `${baseUrl}/admin/v2/identity-providers/${item.id}`)
      .json({
        status: 201,
        message: 'Identity provider created',
        result: presentIdentityProvider(item),
      });
  };
};
