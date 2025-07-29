import { asClass, asFunction, AwilixContainer } from "awilix"
import { handleOAuthErrors } from "./api/handleOAuthErrors"
import { TokenController } from "./api/TokenController"
import { GetTokenWithActiveSessionUseCase } from "./use-cases/GetTokenWithActiveSessionUseCase"
import { GetTokenWithClientCredentialsUseCase } from "./use-cases/GetTokenWithClientCredentialsUseCase"
import { GetTokenWithTokenExchangeUseCase } from "./use-cases/GetTokenWithTokenExchangeUseCase"

export default function registerTokenModule(container: AwilixContainer) {
  container.register({
    handleOAuthErrors: asFunction(handleOAuthErrors).singleton(),

    tokenController: asClass(TokenController).singleton(),

    getTokenWithActiveSessionUseCase: asClass(GetTokenWithActiveSessionUseCase).singleton(),
    getTokenWithClientCredentialsUseCase: asClass(GetTokenWithClientCredentialsUseCase).singleton(),
    getTokenWithTokenExchangeUseCase: asClass(GetTokenWithTokenExchangeUseCase).singleton(),
  })
}
