import { AwilixContainer, asClass } from "awilix"
import { TokenController } from "./api/TokenController"
import { AuthorizationService } from "./commands/AuthorizationService"
import { IssueTokenWithActiveSessionHandler } from "./commands/IssueTokenWithActiveSessionHandler"
import { IssueTokenWithClientCredentialsHandler } from "./commands/IssueTokenWithClientCredentialsHandler"
import { IssueTokenWithTokenExchangeHandler } from "./commands/IssueTokenWithTokenExchangeHandler"

export default async function registerTokenModule(container: AwilixContainer) {
  container.register({
    tokenController: asClass(TokenController).singleton(),

    authorizationService: asClass(AuthorizationService).singleton(),

    issueTokenWithActiveSessionHandler: asClass(IssueTokenWithActiveSessionHandler).singleton(),
    issueTokenWithClientCredentialsHandler: asClass(IssueTokenWithClientCredentialsHandler).singleton(),
    issueTokenWithTokenExchangeHandler: asClass(IssueTokenWithTokenExchangeHandler).singleton(),
  })
}
