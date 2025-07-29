import { asClass, AwilixContainer } from "awilix"
import { TokenController } from "./api/TokenController"
import { GetTokenWithActiveSessionUseCase } from "./use-cases/GetTokenWithActiveSessionUseCase"
import { GetTokenWithClientCredentialsUseCase } from "./use-cases/GetTokenWithClientCredentialsUseCase"
import { GetTokenWithTokenExchangeUseCase } from "./use-cases/GetTokenWithTokenExchangeUseCase"

export default function registerTokenModule(container: AwilixContainer) {
  container.register({
    tokenController: asClass(TokenController).singleton(),

    getTokenWithActiveSessionUseCase: asClass(GetTokenWithActiveSessionUseCase).singleton(),
    getTokenWithClientCredentialsUseCase: asClass(GetTokenWithClientCredentialsUseCase).singleton(),
    getTokenWithTokenExchangeUseCase: asClass(GetTokenWithTokenExchangeUseCase).singleton(),
  })
}
