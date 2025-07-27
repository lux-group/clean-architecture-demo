import { asClass, AwilixContainer } from "awilix"

import {
  GetTokenWithActiveSessionUseCase,
  GetTokenWithClientCredentialsUseCase,
  GetTokenWithTokenExchangeUseCase,
} from "."

export default function registerTokenModule(container: AwilixContainer) {
  container.register({
    getTokenWithActiveSessionUseCase: asClass(GetTokenWithActiveSessionUseCase).singleton(),
    getTokenWithClientCredentialsUseCase: asClass(GetTokenWithClientCredentialsUseCase).singleton(),
    getTokenWithTokenExchangeUseCase: asClass(GetTokenWithTokenExchangeUseCase).singleton(),
  })
}
