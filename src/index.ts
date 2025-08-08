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

async function main() {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  })
  
  await registerConfig(container, environment)
  await registerApp(container)
  await registerDomainServices(container)
  await registerInfrastructureServices(container)
  await registerMemoryRepositories(container)
  
  await createTestData(container)
  
  createServer(container).listen(port, () => console.log(`Listening on port ${port}`))  
}

main().catch(console.error)
