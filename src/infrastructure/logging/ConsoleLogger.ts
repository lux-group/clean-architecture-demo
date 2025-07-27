import { Logger } from "."

export class ConsoleLogger implements Logger {
  error(message: string | unknown, ...meta: unknown[]): void {
    console.error(message)
  }

  warn(message: string | unknown, ...meta: unknown[]): void {
    console.warn(message)
  }

  info(message: string | unknown, ...meta: unknown[]): void {
    console.info(message)
  }
}
