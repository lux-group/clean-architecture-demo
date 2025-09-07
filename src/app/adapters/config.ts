export interface SessionConfig {
  localSessionLifetimeHours: number
  externalSessionLifetimeHours: number
  minSessionRefreshDelayMinutes: number
}

export interface TokenIssuerConfig {
  path: string
  audience: string
  lifetimeSeconds: number
}
