import type { Request, Response } from 'express';
import z from 'zod';
import type { SecureCookieManager } from '~/api/utils/SecureCookieManager';
import { TokenResponse, TokenVersion } from '~/application/ports';
import type { IssueTokenWithActiveSession } from '~/application/use-cases/public/token/IssueTokenWithActiveSession';
import type { IssueTokenWithClientCredentials } from '~/application/use-cases/public/token/IssueTokenWithClientCredentials';
import type { IssueTokenWithTokenExchange } from '~/application/use-cases/public/token/IssueTokenWithTokenExchange';
import { InvalidOperationError } from '~/domain/errors';

const GrantType = {
  ClientCredentials: 'client_credentials',
  SessionCookie: 'urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie',
  TokenExchange: 'urn:ietf:params:oauth:grant-type:token-exchange',
} as const;

const SubjectTokenType = {
  AccessToken: 'urn:ietf:params:oauth:token-type:access_token',
} as const;

type TokenRequest = (
  | {
      grant_type: typeof GrantType.SessionCookie;
      subject_to_impersonate_id?: string;
    }
  | {
      grant_type: typeof GrantType.ClientCredentials;
      client_id: string;
      client_secret: string;
    }
  | {
      grant_type: typeof GrantType.TokenExchange;
      subject_token_type: typeof SubjectTokenType.AccessToken;
      subject_token: string;
      actor_token: string | undefined;
      actor_token_type: string | undefined;
    }
) & {
  access_token_version?: TokenVersion;
  audience?: string;
  scope?: string;
};

export const getTokenSchema = {
  request: {
    body: z.object({
      grant_type: z.string(),
      client_id: z.string().optional(),
      client_secret: z.string().optional(),
      subject_token_type: z.string().optional(),
      subject_token: z.string().optional(),
      actor_token: z.string().optional(),
      actor_token_type: z.string().optional(),
      subject_to_impersonate_id: z.string().optional(),
      access_token_version: z.string().optional(),
      audience: z.string().optional(),
      scope: z.string().optional(),
    }),
  },
  responses: {
    200: z.object({
      token_type: z.literal('bearer'),
      access_token: z.string(),
      expires_in: z.number(),
    }),
    400: z.object({
      error: z.string(),
      error_description: z.string(),
    }),
    401: z.object({
      error: z.string(),
      error_description: z.string(),
    }),
  },
};

type ResponseBody = z.infer<(typeof getTokenSchema.responses)['200']>;

export const getTokenHandler = (
  secureCookieManager: SecureCookieManager,
  issueTokenWithActiveSession: IssueTokenWithActiveSession,
  issueTokenWithClientCredentials: IssueTokenWithClientCredentials,
  issueTokenWithTokenExchange: IssueTokenWithTokenExchange,
) => {
  return async (req: Request, res: Response<ResponseBody>) => {
    const body = req.body as TokenRequest;

    let result: TokenResponse | undefined;

    if (body.grant_type === GrantType.SessionCookie) {
      const cookie = secureCookieManager.getSessionCookie(req, res);
      result = await issueTokenWithActiveSession({
        version: body.access_token_version ?? TokenVersion.V2,
        sessionId: cookie.id,
        nonce: cookie.nonce,
        userToImpersonateId: body.subject_to_impersonate_id,
        audience: body.audience,
        scope: body.scope,
      });
    }

    if (body.grant_type === GrantType.ClientCredentials) {
      result = await issueTokenWithClientCredentials({
        version: body.access_token_version ?? TokenVersion.V2,
        clientId: body.client_id,
        clientSecret: body.client_secret,
        audience: body.audience,
        scope: body.scope,
      });
    }

    if (body.grant_type === GrantType.TokenExchange) {
      result = await issueTokenWithTokenExchange({
        version: body.access_token_version ?? TokenVersion.V2,
        token: body.subject_token,
        audience: body.audience,
        scope: body.scope,
      });
    }

    if (!result) {
      throw new InvalidOperationError('Unsupported grant type');
    }

    res.status(200).json({
      token_type: 'bearer',
      access_token: result.accessToken,
      expires_in: result.expiresIn,
    });
  };
};
