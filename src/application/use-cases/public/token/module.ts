import { AwilixContainer, asFunction } from 'awilix';
import { getJsonWebKeys } from './GetJsonWebKeys';
import { getOpenidConfiguration } from './GetOpenidConfiguration';
import { issueTokenWithActiveSession } from './IssueTokenWithActiveSession';
import { issueTokenWithClientCredentials } from './IssueTokenWithClientCredentials';
import { issueTokenWithTokenExchange } from './IssueTokenWithTokenExchange';

export default async function registerTokenUseCases(container: AwilixContainer) {
  container.register({
    getJsonWebKeys: asFunction(getJsonWebKeys).singleton(),
    getOpenidConfiguration: asFunction(getOpenidConfiguration).singleton(),
    issueTokenWithActiveSession: asFunction(issueTokenWithActiveSession).singleton(),
    issueTokenWithClientCredentials: asFunction(issueTokenWithClientCredentials).singleton(),
    issueTokenWithTokenExchange: asFunction(issueTokenWithTokenExchange).singleton(),
  });
}
