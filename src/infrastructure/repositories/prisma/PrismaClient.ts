import * as prisma from "@prisma/client"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import { readReplicas } from "@prisma/extension-read-replicas"
import { Logger } from "~/infrastructure/logging"
import { ConcurrencyError, ValidationError } from "~/domain/errors"

export type PrismaClient = {
  $primary<T extends object>(this: T): prisma.PrismaClient
  $replica<T extends object>(this: T): prisma.PrismaClient
  $connect(): Promise<void>
  $disconnect(): Promise<void>
}

const convertKnownErrors = (logger: Logger) =>
  prisma.Prisma.defineExtension((client) => client.$extends({
    name: "convertKnownErrorsExtension",
    query: {
      $allModels: {
        async $allOperations({ args, query }: {
          args: any
          query: (args: any) => prisma.PrismaPromise<any>
        }): Promise<any> {
          try {
            return await query(args)
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

            // TODO: Anonymise args
            logger.error("Prisma operation failed.", { error, args })

            throw error
          }
        },
      },
    },
  }))

export const createPrismaClient = (logger: Logger, primaryUrl: string, secondaryUrls?: string[]) =>
  new prisma.PrismaClient({ datasourceUrl: primaryUrl })
    .$extends(convertKnownErrors(logger))
    .$extends(readReplicas({ url: secondaryUrls ?? [primaryUrl] })) as unknown as PrismaClient
