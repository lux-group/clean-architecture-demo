import { Prisma } from "@prisma/client"
import { Logger } from "~/app/ports"

// We have to use any because even Prisma internally uses any for extensions.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const logFailedQueryDetails = (logger: Logger) => ({
  query: {
    $allModels: {
      async $allOperations({
        model,
        operation,
        args,
        query,
      }: {
        model: string
        operation: string
        args: any
        query: (args: any) => Prisma.PrismaPromise<any>
      }): Promise<any> {
        try {
          return await query(args)
        } catch (error: unknown) {
          if (
            error instanceof Prisma.PrismaClientInitializationError ||
            error instanceof Prisma.PrismaClientKnownRequestError ||
            error instanceof Prisma.PrismaClientValidationError ||
            error instanceof Prisma.PrismaClientUnknownRequestError
          ) {
            const logParams: Record<string, unknown> = {
              model,
              operation,
              args,
              clientVersion: error.clientVersion,
            }

            if (error instanceof Prisma.PrismaClientInitializationError) {
              logParams.error = {
                message: error.message,
                code: error.errorCode,
              }
            } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
              logParams.meta = error.meta
              logParams.error = {
                message: error.message,
                code: error.code,
                batchRequestIdx: error.batchRequestIdx,
              }
            } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
              logParams.error = {
                message: error.message,
                batchRequestIdx: error.batchRequestIdx,
              }
            } else {
              logParams.error = {
                message: error.message,
              }
            }

            // IMPORTANT: Make sure that all sensitive fields
            // including secrets and PII are masked by the logger.
            logger.warn("Prisma operation failed.", logParams)
          }

          throw error
        }
      },
    },
  },
})
