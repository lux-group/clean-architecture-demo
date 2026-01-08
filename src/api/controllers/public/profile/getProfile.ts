import { getRequestContext } from '@luxuryescapes/lib-request-context';
import type { Request, Response } from 'express';
import z from 'zod';
import type { GetProfileById } from '~/application/use-cases/public/profile/GetProfileById';
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

export const getProfileHandler = (getProfileById: GetProfileById) => {
  return async (req: Request, res: Response<ResponseBody>) => {
    // Prefer the user ID injected by the authorize middleware; fall back to JWT subject
    const extensibleRequest = req as any;
    const userId = extensibleRequest?.user?.id_member ?? extensibleRequest?.jwt?.sub;
    const query = { id: String(userId) };
    const item = await getProfileById(query);
    res.json({
      status: 200,
      message: 'Profile found',
      result: presentProfile(item),
    });
  };
};
