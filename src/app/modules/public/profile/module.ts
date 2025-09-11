import { AwilixContainer, asClass } from "awilix"
import { ProfileController } from "./api/ProfileController"
import { GetProfileByIdHandler } from "./queries/GetProfileByIdHandler"

export default async function registerPublicModule(container: AwilixContainer) {
  container.register({
    profileController: asClass(ProfileController).singleton(),

    getProfileByIdHandler: asClass(GetProfileByIdHandler).singleton(),
  })
}
