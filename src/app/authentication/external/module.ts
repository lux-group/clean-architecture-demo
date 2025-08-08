import { asClass, AwilixContainer } from "awilix"
import { ExternalAuthenticationController } from "./api/ExternalAuthenticationController"
import { CreateSignInRequestHandler } from "./commands/CreateSignInRequestHandler"
import { CreateSignOutRequestHandler } from "./commands/CreateSignOutRequestHandler"
import { FrontChannelSignOutHandler } from "./commands/FrontChannelSignOutHandler"
import { ProcessSignInResponseHandler } from "./commands/ProcessSignInResponseHandler"

export default async function registerExternalAuthenticationModule(container: AwilixContainer) {
  container.register({
    externalAuthenticationController: asClass(ExternalAuthenticationController).singleton(),

    createSignInRequestHandler: asClass(CreateSignInRequestHandler).singleton(),
    createSignOutRequestHandler: asClass(CreateSignOutRequestHandler).singleton(),
    frontChannelSignOutHandler: asClass(FrontChannelSignOutHandler).singleton(),
    processSignInResponseHandler: asClass(ProcessSignInResponseHandler).singleton(),
  })
}
