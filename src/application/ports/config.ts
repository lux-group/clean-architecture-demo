export interface SessionConfig {
  localSessionLifetimeHours: number;
  minSessionRefreshDelayMinutes: number;
}

export interface TokenIssuerConfig {
  path: string;
  audience: string;
  lifetimeSeconds: number;
}
