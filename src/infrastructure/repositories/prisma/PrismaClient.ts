import * as prisma from "@prisma/client"
import { readReplicas } from "@prisma/extension-read-replicas"
import { Logger } from "~/app/shared/adapters"
import { convertKnownErrors } from "./extensions/convertKnownErrors"
import { logFailedQueryDetails } from "./extensions/logFailedQueryDetails"

export type PrismaClient = {
  $primary<T extends object>(this: T): prisma.PrismaClient
  $replica<T extends object>(this: T): prisma.PrismaClient
  $connect(): Promise<void>
  $disconnect(): Promise<void>
}

export const createPrismaClient = (logger: Logger, primaryUrl: string, secondaryUrls?: string[]) =>
  new prisma.PrismaClient({ datasourceUrl: primaryUrl })
    .$extends(convertKnownErrors())
    .$extends(logFailedQueryDetails(logger))
    .$extends(readReplicas({ url: secondaryUrls ?? [primaryUrl] })) as unknown as PrismaClient
