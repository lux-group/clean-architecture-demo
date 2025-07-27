import * as prisma from "@prisma/client"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { readReplicas } from "@prisma/extension-read-replicas"
import { ConcurrencyError, ValidationError } from "~/domain/errors"

export type PrismaClient = ReturnType<typeof createPrismaClient>

async function convertKnownErrors(action: () => prisma.PrismaPromise<any>): Promise<any> {
  try {
    return await action()
  } catch (error: PrismaClientKnownRequestError | any) {
    if (error.code == "P2002") {
      const resource = error.meta?.modelName ?? "resource"
      const fields = error.meta?.target as string[]
      const message = `${resource} with same ${fields.join(" and ")} already exists.`
      throw new ValidationError(message)
    }

    if (error.code == "P2025") {
      throw new ConcurrencyError("The resource you are trying to access has been modified or deleted by another user.")
    }

    throw error
  }
}

export const createPrismaClient = (primaryUrl: string, secondaryUrls?: string[]) =>
  new prisma.PrismaClient({ datasourceUrl: primaryUrl })
  .$extends({
    name: "convertKnownErrorsExtension",
    query: {
      $allModels: {
        async $allOperations({
          args,
          query,
        }: {
          args: any
          query: (args: any) => prisma.PrismaPromise<any>
        }): Promise<any> {
          return await convertKnownErrors(() => query(args))
        },
      },
    },
  })
  .$extends(readReplicas({ url: secondaryUrls ?? [primaryUrl] }))
