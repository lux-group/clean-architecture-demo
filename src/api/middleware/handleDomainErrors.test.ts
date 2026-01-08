import { mockLogger } from '@test/mocks';
import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthenticationError,
  AuthorizationError,
  InvalidOperationError,
  NotFoundError,
  ValidationError,
} from '~/domain/errors';
import { handleDomainErrorsMiddlewareFactory } from './handleDomainErrors';

describe('Handle Domain Errors Middleware', () => {
  const nextFunction: NextFunction = vi.fn();
  let mockRequest: Request;
  let mockResponse: Response;
  let handler: (err: unknown, req: Request, res: Response, next: NextFunction) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = { headers: {} } as Request;
    mockResponse = {} as Response;
    mockResponse.status = vi.fn().mockReturnValue(mockResponse);
    mockResponse.json = vi.fn().mockReturnValue(mockResponse);

    handler = handleDomainErrorsMiddlewareFactory(mockLogger);
  });

  describe('Standard format (default)', () => {
    it('formats ValidationError as 400 with details', () => {
      const error = new ValidationError('Invalid input', [{ message: 'Email is required', path: 'email' }]);

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 400, message: 'Invalid input', errors: error.errors });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('formats InvalidOperationError as 400', () => {
      const error = new InvalidOperationError('Operation not allowed');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 400, message: 'Operation not allowed' });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('formats AuthenticationError as 401', () => {
      const error = AuthenticationError.passwordFailed(undefined, 'Wrong password');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 401, message: error.message });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('formats AuthorizationError as 403', () => {
      const error = AuthorizationError.unauthorizedScope('admin', 'user-1');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 403, message: error.message });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('formats NotFoundError as 404', () => {
      const error = new NotFoundError('Resource not found');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ status: 404, message: 'Resource not found' });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });
  });

  describe('OAuth2 format (when Content-Type is application/x-www-form-urlencoded)', () => {
    beforeEach(() => {
      mockRequest.headers['content-type'] = 'application/x-www-form-urlencoded';
    });

    it('formats InvalidOperationError as invalid_request', () => {
      const error = new InvalidOperationError('Bad request');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'invalid_request', error_description: 'Bad request' });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('formats ValidationError as invalid_request with description', () => {
      const error = new ValidationError('Payload invalid');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'invalid_request',
        error_description: 'Payload invalid',
      });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('formats AuthenticationError as unauthorized_client', () => {
      const error = AuthenticationError.passwordFailed('user-1', 'Wrong password');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'unauthorized_client',
        error_description: error.message,
      });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('formats AuthorizationError as access_denied', () => {
      const error = AuthorizationError.unauthorizedAudience('aud', 'user-1');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'access_denied', error_description: error.message });
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });

    it('calls next(err) for unmapped domain errors', () => {
      const error = new NotFoundError('not mapped in OAuth2');

      handler(error, mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalledWith(error);
      expect(mockLogger.info).toHaveBeenCalledWith(error);
    });
  });

  it('calls next(err) for non-domain errors', () => {
    const error = new Error('regular error');

    handler(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalledWith(error);
  });
});
