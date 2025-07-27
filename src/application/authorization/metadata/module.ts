import { asClass, AwilixContainer } from "awilix"

import {
  GetJwksUseCase,
  GetOpenidConfigurationUseCase,
} from "."

export default function registerMetadataModule(container: AwilixContainer) {
  container.register({
    getJwksUseCase: asClass(GetJwksUseCase).singleton(),
    getOpenidConfigurationUseCase: asClass(GetOpenidConfigurationUseCase).singleton(),
  })
}
