import type { Request, Response } from 'express';
import z from 'zod';
import type { GetSessionByIdHandler } from '~/application/use-cases/admin/session/GetSessionByIdHandler';
import { presentSession, sessionSchema } from './shared';

export const getSessionByIdSchema = {
  request: {
    params: z.object({
      id: z.uuid(),
    }),
  },
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: sessionSchema,
    }),
    404: z.object({
      status: z.literal(404),
      message: z.string(),
    }),
  },
};

type RequestParams = z.infer<typeof getSessionByIdSchema.request.params>;
type ResponseBody = z.infer<(typeof getSessionByIdSchema.responses)['200']>;

export const getSessionByIdHandler = (getSessionByIdHandler: GetSessionByIdHandler) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const query = { id: req.params.id };
    const item = await getSessionByIdHandler.execute(query);
    res.json({
      status: 200,
      message: 'Session found',
      result: presentSession(item),
    });
  };
};
