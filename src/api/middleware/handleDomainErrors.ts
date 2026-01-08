import { NextFunction, Request, Response } from 'express';
import { Logger } from '~/application/ports';
import {
  AuthenticationError,
  AuthorizationError,
  DomainError,
  InvalidOperationError,
  NotFoundError,
  ValidationError,
} from '~/domain/errors';

function formatStandardError(err: DomainError): [number, object] | undefined {
  if (err instanceof ValidationError) return [400, { status: 400, message: err.message, errors: err.errors }];
  if (err instanceof InvalidOperationError) return [400, { status: 400, message: err.message }];
  if (err instanceof AuthenticationError) return [401, { status: 401, message: err.message }];
  if (err instanceof AuthorizationError) return [403, { status: 403, message: err.message }];
  if (err instanceof NotFoundError) return [404, { status: 404, message: err.message }];
  return undefined;
}

function formatOAuth2Error(err: DomainError): [number, object] | undefined {
  if (err instanceof InvalidOperationError) return [400, { error: 'invalid_request', error_description: err.message }];
  if (err instanceof ValidationError) return [400, { error: 'invalid_request', error_description: err.message }];
  if (err instanceof AuthenticationError)
    return [401, { error: 'unauthorized_client', error_description: err.message }];
  if (err instanceof AuthorizationError) return [403, { error: 'access_denied', error_description: err.message }];
  return undefined;
}

export function handleDomainErrorsMiddlewareFactory(logger: Logger) {
  return (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof DomainError) {
      logger.info(err);

      const isFormUrlencoded = req.headers['content-type'] === 'application/x-www-form-urlencoded';
      const result = isFormUrlencoded ? formatOAuth2Error(err) : formatStandardError(err);
      if (result) {
        res.status(result[0]).json(result[1]);
        return;
      }
    }

    next(err);
  };
}
