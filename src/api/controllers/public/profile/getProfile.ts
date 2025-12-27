import { getRequestContext } from '@luxuryescapes/lib-request-context';
import type { Request, Response } from 'express';
import z from 'zod';
import type { GetProfileByIdHandler } from '~/application/use-cases/public/profile/GetProfileByIdHandler';
import { presentProfile, profileSchema } from './shared';

export const getProfileSchema = {
  request: {},
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: profileSchema,
    }),
    401: z.object({
      status: z.literal(401),
      message: z.string(),
    }),
  },
};

type ResponseBody = z.infer<(typeof getProfileSchema.responses)['200']>;

export const getProfileHandler = (getProfileByIdHandler: GetProfileByIdHandler) => {
  return async (_req: Request, res: Response<ResponseBody>) => {
    const context = getRequestContext();
    const query = { id: context!.user!.id };
    const item = await getProfileByIdHandler.execute(query);
    res.json({
      status: 200,
      message: 'Profile found',
      result: presentProfile(item),
    });
  };
};
