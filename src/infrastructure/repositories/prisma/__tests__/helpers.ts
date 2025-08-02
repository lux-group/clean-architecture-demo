import { execSync } from "node:child_process"
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { createPrismaClient, PrismaClient } from "~/infrastructure/repositories/prisma/PrismaClient"
import { EncryptionProvider } from "~/infrastructure/crypto"

class MockEncryptionProvider implements EncryptionProvider {
  encrypt = (data: string) => `encrypted_${data}`
  decrypt = (data: string) => data.replace("encrypted_", "")
}

export interface PrismaTestContext {
  postgres: StartedPostgreSqlContainer
  prismaClient: PrismaClient,
  encryptionProvider: EncryptionProvider
  destroy: () => Promise<void>
}

export async function createPrismaTestContext(): Promise<PrismaTestContext> {
  const postgres = await new PostgreSqlContainer("postgres:17.4").start()
  const env = { ...process.env, DATABASE_URL: postgres.getConnectionUri() }
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" })

  const prismaClient = createPrismaClient(postgres.getConnectionUri())

  const encryptionProvider = new MockEncryptionProvider()

  return { postgres, prismaClient, encryptionProvider, destroy: async () => {
    await prismaClient.$disconnect()
    await postgres.stop()
  }}
}
