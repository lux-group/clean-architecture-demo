import type { Request, Response } from 'express';
import z from 'zod';
import { parseQuery } from '~/api/utils/parseQuery';
import type { SearchSessions } from '~/application/use-cases/admin/session/SearchSessions';
import type { Session } from '~/domain/entities';
import { presentSession, sessionSchema } from './shared';

export const searchSessionsSchema = {
  request: {},
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: z.array(sessionSchema),
      total: z.int(),
    }),
  },
};

type ResponseBody = z.infer<(typeof searchSessionsSchema.responses)['200']>;

export const searchSessionsHandler = (searchSessions: SearchSessions) => {
  return async (req: Request<unknown, ResponseBody>, res: Response<ResponseBody>) => {
    const query = parseQuery<Session>(req.query, ['createdAt'], ['userId', 'identityProviderId']);
    const result = await searchSessions(query);
    res.json({
      status: 200,
      message: `${result.total} Sessions found`,
      result: result.items.map(item => presentSession(item)),
      total: result.total,
    });
  };
};
