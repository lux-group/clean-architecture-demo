export interface Logger {
  error(message: string | unknown, ...meta: unknown[]): void
  warn(message: string | unknown, ...meta: unknown[]): void
  info(message: string | unknown, ...meta: unknown[]): void
}
