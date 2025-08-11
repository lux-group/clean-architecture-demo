import { createContainer, InjectionMode, AwilixContainer } from "awilix"
import { Server } from "http"
import createServer from "~/app/server"
import registerApp from "~/app/module"
import registerDomainServices from "~/domain/services/module"
import registerInfrastructureServices from "~/infrastructure/module"
import registerMemoryRepositories from "~/infrastructure/repositories/memory/module"
import registerConfig from "~/infrastructure/config/module"
import createTestData from "~/data"

const environment = process.env.NODE_ENV || "dev"
const port = process.env.PORT || 3000

let isShuttingDown = false

async function shutdown(server: Server, container: AwilixContainer): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true

  // Stop the Express server.
  await new Promise<void>(resolve => server.close(() => resolve()))

  try {
    // Dispose the container. This will close all connections to the databases.
    await container.dispose()
    process.exit(0)
  } catch (error) {
    console.error("Error during shutdown:", error)
    process.exit(1)
  }
}

async function start(): Promise<void> {
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

  const app = createServer(container)
  const server = app.listen(port, () => console.log(`Listening on port ${port}`))

  process.on("SIGINT", () => shutdown(server, container))
  process.on("SIGTERM", () => shutdown(server, container))
}

start().catch(console.error)
