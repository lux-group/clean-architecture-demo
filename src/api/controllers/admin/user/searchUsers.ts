import type { Request, Response } from 'express';
import z from 'zod';
import { parseQuery } from '~/api/utils/parseQuery';
import type { SearchUsersHandler } from '~/application/use-cases/admin/user/SearchUsersHandler';
import type { User } from '~/domain/entities';
import { presentUser, userSchema } from './shared';

export const searchUsersSchema = {
  request: {},
  responses: {
    200: z.object({
      status: z.literal(200),
      message: z.string(),
      result: z.array(userSchema),
      total: z.int(),
    }),
  },
};

type ResponseBody = z.infer<(typeof searchUsersSchema.responses)['200']>;

export const searchUsersHandler = (searchUsersHandler: SearchUsersHandler) => {
  return async (req: Request<unknown, ResponseBody>, res: Response<ResponseBody>) => {
    const query = parseQuery<User>(
      req.query,
      ['createdAt', 'email', 'givenName', 'surname'],
      ['email', 'givenName', 'surname'],
    );
    const result = await searchUsersHandler.execute(query);
    res.json({
      status: 200,
      message: `${result.total} Users found`,
      result: result.items.map(item => presentUser(item)),
      total: result.total,
    });
  };
};
