export interface ApiConfig {
  host: string;
  basePath: string;
  adminBasePath: string;
}

export interface SessionConfig {
  localSessionLifetimeHours: number;
  minSessionRefreshDelayMinutes: number;
}

export interface TokenIssuerConfig {
  path: string;
  audience: string;
  lifetimeSeconds: number;
}
