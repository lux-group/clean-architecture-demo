import type { Request, Response } from 'express';
import z from 'zod';
import type { TerminateSessionHandler } from '~/application/use-cases/admin/session/TerminateSessionHandler';

export const terminateSessionSchema = {
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

type RequestParams = z.infer<typeof terminateSessionSchema.request.params>;
type ResponseBody = z.infer<(typeof terminateSessionSchema.responses)['204']>;

export const terminateSessionHandler = (terminateSessionHandler: TerminateSessionHandler) => {
  return async (req: Request<RequestParams, ResponseBody>, res: Response<ResponseBody>) => {
    const command = { sessionId: req.params.id };
    await terminateSessionHandler.execute(command);
    res.status(204).send({
      status: 204,
      message: 'Session terminated',
    });
  };
};
