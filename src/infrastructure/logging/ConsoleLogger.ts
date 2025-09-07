import { Logger } from "~/app/shared/adapters"

export class ConsoleLogger implements Logger {
  error(message: string | unknown, ...meta: unknown[]): void {
    console.error(message, ...meta)
  }

  warn(message: string | unknown, ...meta: unknown[]): void {
    console.warn(message, ...meta)
  }

  info(message: string | unknown, ...meta: unknown[]): void {
    console.info(message, ...meta)
  }
}
