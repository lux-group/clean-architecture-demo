import { router as buildRouter, RouterAbstraction, RouterOptions } from '@luxuryescapes/router';
import { AwilixContainer, asClass, asFunction } from 'awilix';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import { TokenIssuerConfig } from '~/application/ports';
import identityProviderAdminRoutes from './controllers/admin/identity-provider/routes';
import sessionAdminRoutes from './controllers/admin/session/routes';
import signingKeyAdminRoutes from './controllers/admin/signing-key/routes';
import userAdminRoutes from './controllers/admin/user/routes';
import authExternalRoutes from './controllers/public/auth-external/routes';
import authLocalRoutes from './controllers/public/auth-local/routes';
import profileRoutes from './controllers/public/profile/routes';
import tokenRoutes from './controllers/public/token/routes';
import { SecureCookieManager } from './utils/SecureCookieManager';

const basePath = '/auth/v2';
const adminBasePath = `${basePath}/admin`;

export const createRouter = (app: Express, container: AwilixContainer): RouterAbstraction => {
  const tokenIssuerPath = container.resolve<TokenIssuerConfig>('tokenIssuerConfig').path;

  const routerOptions: RouterOptions = {
    swaggerBaseProperties: {
      info: {
        title: 'Clean Architecture Demo',
        description: 'Clean Architecture Demo',
        version: '2.0.0',
      },
    },
  };

  const router = buildRouter(app, routerOptions);

  identityProviderAdminRoutes.mount(container, router, adminBasePath);
  sessionAdminRoutes.mount(container, router, adminBasePath);
  signingKeyAdminRoutes.mount(container, router, adminBasePath);
  userAdminRoutes.mount(container, router, adminBasePath);

  authExternalRoutes.mount(container, router, basePath);
  authLocalRoutes.mount(container, router, basePath);
  profileRoutes.mount(container, router, basePath);
  tokenRoutes.mount(container, router, tokenIssuerPath);

  router.serveSwagger(`${basePath}/docs`);

  // TODO: Register custom error handler.

  router.useErrorHandler();

  return router;
};

const createApp = (container: AwilixContainer): Express => {
  const helmetOptions: HelmetOptions = {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", "'unsafe-inline'"], // Only required for demo page; not recommended for production
      },
    },
  };

  const app = express()
    .use(helmet(helmetOptions))
    .use(cookieParser())
    .use(express.json({ limit: '100kb' }))
    .use(express.urlencoded({ limit: '100kb' }))
    .use('/', express.static(`${__dirname}/web`));

  createRouter(app, container);

  return app;
};

export default async function registerApi(container: AwilixContainer) {
  container.register({
    secureCookieManager: asClass(SecureCookieManager).singleton(),
    app: asFunction(createApp).singleton(),
  });
}
