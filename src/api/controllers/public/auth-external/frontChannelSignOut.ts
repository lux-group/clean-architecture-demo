import type { Request, Response } from 'express';
import z from 'zod';
import type { FrontChannelSignOut } from '~/application/use-cases/public/auth-external/FrontChannelSignOut';

export const frontChannelSignOutSchema = {
  request: {
    query: z.object({
      sid: z.string(),
    }),
  },
  responses: {
    200: z.object().optional(),
  },
};

type RequestQuery = z.infer<typeof frontChannelSignOutSchema.request.query>;

export const frontChannelSignOutHandler = (frontChannelSignOut: FrontChannelSignOut) => {
  return async (req: Request<unknown, unknown, unknown, RequestQuery>, res: Response) => {
    const command = {
      sid: req.query.sid as string,
    };

    await frontChannelSignOut(command);
    res.status(200).send();
  };
};
