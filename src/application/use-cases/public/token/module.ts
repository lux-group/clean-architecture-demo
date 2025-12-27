import { AwilixContainer, asClass } from 'awilix';
import { GetJsonWebKeysHandler } from './GetJsonWebKeysHandler';
import { GetOpenidConfigurationHandler } from './GetOpenidConfigurationHandler';
import { IssueTokenWithActiveSessionHandler } from './IssueTokenWithActiveSessionHandler';
import { IssueTokenWithClientCredentialsHandler } from './IssueTokenWithClientCredentialsHandler';
import { IssueTokenWithTokenExchangeHandler } from './IssueTokenWithTokenExchangeHandler';

export default async function registerTokenUseCases(container: AwilixContainer) {
  container.register({
    getJsonWebKeysHandler: asClass(GetJsonWebKeysHandler).singleton(),
    getOpenidConfigurationHandler: asClass(GetOpenidConfigurationHandler).singleton(),
    issueTokenWithActiveSessionHandler: asClass(IssueTokenWithActiveSessionHandler).singleton(),
    issueTokenWithClientCredentialsHandler: asClass(IssueTokenWithClientCredentialsHandler).singleton(),
    issueTokenWithTokenExchangeHandler: asClass(IssueTokenWithTokenExchangeHandler).singleton(),
  });
}
