import { AwilixContainer } from 'awilix';
import { Application } from 'express';
import { TokenIssuer, TokenRequest, TokenVersion } from '~/application/ports';
import { TestDataContext } from './TestDataContext';
import { createContainer } from '~/createContainer';

export interface TestContext {
  container: AwilixContainer;
  server: Application;
  data: TestDataContext;
  createAccessToken: (userId: string, scopes: string[]) => Promise<string>;
}

export const getTestContext = async (): Promise<TestContext> => {
  const container = await createContainer('test');
  const server = container.resolve<Application>('app');
  const data = new TestDataContext(container);

  // Ensure we have a signing key.
  await data.getActiveSigningKey();

  const createAccessToken = async (userId: string, scopes: string[]) => {
    const tokenIssuer = container.resolve<TokenIssuer>('tokenIssuer');
    const request: TokenRequest = { version: TokenVersion.V2, userId, scopes, customClaims: {} };
    return (await tokenIssuer.createAccessToken(request)).accessToken;
  };

  return { container, server, data, createAccessToken };
};
