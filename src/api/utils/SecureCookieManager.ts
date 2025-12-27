import { createHash } from 'node:crypto';
import { CookieOptions, Request, Response } from 'express';
import { EncryptionProvider, TokenIssuerConfig } from '~/application/ports';
import { Session } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';

interface SessionCookie {
  readonly id: string;
  readonly nonce: string;
}

export class SecureCookieManager {
  private readonly stateCookieName = 'auth-state';
  private readonly sessionCookieName = 'auth-session';

  constructor(
    private readonly encryptionProvider: EncryptionProvider,
    private readonly tokenIssuerConfig: TokenIssuerConfig,
  ) {}

  setStateCookie = (req: Request<any>, res: Response, state: object) =>
    this.setCookie(req, res, this.stateCookieName, state, false, undefined);

  getStateCookie = <T extends object>(req: Request<any>, res: Response) =>
    this.getCookie<T>(req, res, this.stateCookieName);

  getAndRemoveStateCookie = <T extends object>(req: Request<any>, res: Response) =>
    this.getAndRemoveCookie<T>(req, res, this.stateCookieName);

  setSessionCookie = (req: Request<any>, res: Response, session: Session) =>
    this.setCookie(req, res, this.sessionCookieName, { id: session.id, nonce: session.nonce }, true, session.expiresAt);

  getSessionCookie = (req: Request<any>, res: Response) =>
    this.getCookie<SessionCookie>(req, res, this.sessionCookieName);

  getAndRemoveSessionCookie = (req: Request<any>, res: Response) =>
    this.getAndRemoveCookie<SessionCookie>(req, res, this.sessionCookieName);

  removeSessionCookie = (res: Response<any>) => res.clearCookie(this.sessionCookieName);

  encryptCookie = (payload: object, headers: Record<string, string | string[] | undefined>): string => {
    (payload as Record<string, string>).device = this.extractFingerprint(headers);
    const json = JSON.stringify(payload);
    return this.encryptionProvider.encrypt(json);
  };

  private setCookie(req: Request, res: Response, name: string, payload: object, sameSite?: boolean, expires?: Date) {
    const options: CookieOptions = {
      secure: true, // Don't send cookie over plain HTTP.
      httpOnly: true, // Don't allow cookie to be read by javascript to prevent XSS attacks.
      sameSite: sameSite ? 'strict' : 'lax', // Use strict where possible but some redirects may require lax.
      path: this.tokenIssuerConfig.path, // Only send cookie to auth/v2/* endpoints
      expires,
    };

    res.cookie(name, this.encryptCookie(payload, req.headers), options);
  }

  private getCookie<T extends object>(req: Request, res: Response, name: string): T {
    const encrypted = req.cookies[name];
    if (!encrypted) {
      throw AuthenticationError.activeSessionCookieNotFound();
    }

    let payload: T;
    try {
      const decrypted = this.encryptionProvider.decrypt(encrypted);
      payload = JSON.parse(decrypted);
    } catch {
      res.clearCookie(name);
      throw AuthenticationError.activeSessionCookieInvalid();
    }

    if ((payload as Record<string, string>).device !== this.extractFingerprint(req.headers)) {
      res.clearCookie(name);
      throw AuthenticationError.activeSessionCookieInvalid();
    }

    return payload;
  }

  private getAndRemoveCookie<T extends object>(req: Request, res: Response, name: string): T {
    const payload = this.getCookie<T>(req, res, name);
    res.clearCookie(name);
    return payload;
  }

  private extractFingerprint(headers: Record<string, string | string[] | undefined>): string {
    const rawUserAgent = (headers['user-agent'] as string) || '';
    const fingerprint = (headers['cloudfront-viewer-ja4-fingerprint'] as string) || '';
    const userAgent = rawUserAgent.replace(/\/[\d.]+/g, '').trim();
    return createHash('sha256')
      .update(userAgent + fingerprint)
      .digest('hex');
  }
}
