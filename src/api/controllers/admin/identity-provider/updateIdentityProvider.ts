import type { Request, Response } from 'express';
import z from 'zod';
import type {
  UpdateIdentityProvider,
  UpdateIdentityProviderCommand,
} from '~/application/use-cases/admin/identity-provider/UpdateIdentityProvider';
import { MapperBuilder } from '~/lib/MapperBuilder';
import { identityProviderSchema, presentIdentityProvider } from './shared';

export const updateIdentityProviderSchema = {
  request: {
    params: z.object({
      id: z.uuid(),
    }),
    body: identityProviderSchema.omit({
      id: true,
      created_at: true,
      updated_at: true,
    }),
  },
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: identityProviderSchema,
    }),
    400: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
    404: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestParams = z.infer<typeof updateIdentityProviderSchema.request.params>;
type RequestBody = z.infer<typeof updateIdentityProviderSchema.request.body>;
type ResponseBody = z.infer<(typeof updateIdentityProviderSchema.responses)['200']>;

const mapRequestToCommand = MapperBuilder.for<RequestBody>().toCamelCase().build<UpdateIdentityProviderCommand>();

export const updateIdentityProviderHandler = (updateIdentityProvider: UpdateIdentityProvider) => {
  return async (req: Request<RequestParams, ResponseBody, RequestBody>, res: Response<ResponseBody>) => {
    const command = {
      id: req.params.id,
      ...mapRequestToCommand(req.body),
    };
    const item = await updateIdentityProvider(command);
    res.json({
      status: 200,
      message: 'Identity provider updated',
      result: presentIdentityProvider(item),
    });
  };
};
