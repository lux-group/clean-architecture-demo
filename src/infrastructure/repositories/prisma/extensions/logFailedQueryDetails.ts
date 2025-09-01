import { Prisma } from "@prisma/client"
import { Logger } from "~/infrastructure/logging";

export const logFailedQueryDetails = (logger: Logger) => ({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: {
        model: string
        operation: string
        args: any
        query: (args: any) => Prisma.PrismaPromise<any>
      }): Promise<any> {
        try {
          return await query(args)
        } catch (error: unknown) {
          const logParams: Record<string, unknown> = {
            model,
            operation,
            args
          }

          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            logParams.meta = error.meta;
            logParams.error = {
              message: error.message,
              code: error.code,
            }
          } else if (error instanceof Error) {
            logParams.error = {
              message: error.message,
            }
          } else if (typeof error === "string") {
            logParams.error = {
              message: error,
            }
          }

          // IMPORTANT: Make sure that all sensitive fields
          // including secrets and PII are masked by the logger.
          logger.error("Prisma operation failed.", logParams)

          throw error
        }
      },
    },
  },
})
