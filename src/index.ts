import { createContainer, InjectionMode } from "awilix"
import createServer from "~/app/server"
import registerApp from "~/app/module"
import registerDomainServices from "~/domain/services/module"
import registerInfrastructureServices from "~/infrastructure/module"
import registerMemoryRepositories from "~/infrastructure/repositories/memory/module"
import registerConfig from "~/infrastructure/config/module"
import createTestData from "~/data"

const environment = process.env.NODE_ENV || "dev"
const port = process.env.PORT || 3000

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
})

registerConfig(container, environment)
registerApp(container)
registerDomainServices(container)
registerInfrastructureServices(container)
registerMemoryRepositories(container)

createTestData(container)

createServer(container).listen(port, () => console.log(`Listening on port ${port}`))
