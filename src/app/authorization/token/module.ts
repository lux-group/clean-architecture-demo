import { asClass, asFunction, AwilixContainer } from "awilix"
import { handleOAuthErrors } from "./api/handleOAuthErrors"
import { TokenController } from "./api/TokenController"
import { IssueTokenWithActiveSessionHandler } from "./commands/IssueTokenWithActiveSessionHandler"
import { IssueTokenWithClientCredentialsHandler } from "./commands/IssueTokenWithClientCredentialsHandler"
import { IssueTokenWithTokenExchangeHandler } from "./commands/IssueTokenWithTokenExchangeHandler"

export default function registerTokenModule(container: AwilixContainer) {
  container.register({
    handleOAuthErrors: asFunction(handleOAuthErrors).singleton(),

    tokenController: asClass(TokenController).singleton(),

    issueTokenWithActiveSessionHandler: asClass(IssueTokenWithActiveSessionHandler).singleton(),
    issueTokenWithClientCredentialsHandler: asClass(IssueTokenWithClientCredentialsHandler).singleton(),
    issueTokenWithTokenExchangeHandler: asClass(IssueTokenWithTokenExchangeHandler).singleton(),
  })
}
