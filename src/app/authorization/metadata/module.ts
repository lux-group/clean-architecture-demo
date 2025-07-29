import { asClass, AwilixContainer } from "awilix"
import { MetadataController } from "./api/MetadataController"
import { GetJwksUseCase } from "./use-cases/GetJwksUseCase"
import { GetOpenidConfigurationUseCase } from "./use-cases/GetOpenidConfigurationUseCase"

export default function registerMetadataModule(container: AwilixContainer) {
  container.register({
    metadataController: asClass(MetadataController).singleton(),

    getJwksUseCase: asClass(GetJwksUseCase).singleton(),
    getOpenidConfigurationUseCase: asClass(GetOpenidConfigurationUseCase).singleton(),
  })
}
