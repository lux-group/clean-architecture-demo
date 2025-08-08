import { asClass, AwilixContainer } from "awilix"
import { SessionController } from "./api/SessionController"
import { TerminateSessionHandler } from "./commands/TerminateSessionHandler"
import { GetSessionByIdHandler } from "./queries/GetSessionByIdHandler"
import { SearchSessionsHandler } from "./queries/SearchSessionsHandler"

export default async function registerSessionAdminModule(container: AwilixContainer) {
  container.register({
    sessionController: asClass(SessionController).singleton(),

    terminateSessionHandler: asClass(TerminateSessionHandler).singleton(),

    getSessionByIdHandler: asClass(GetSessionByIdHandler).singleton(),
    searchSessionsHandler: asClass(SearchSessionsHandler).singleton(),
  })
}
