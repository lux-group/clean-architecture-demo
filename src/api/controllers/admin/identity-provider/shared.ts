import z from 'zod';
import { IdentityProvider, IdentityProviderAuthSettings, IdentityProviderType } from '~/domain/entities';
import { MapperBuilder } from '~/lib/MapperBuilder';

export const identityProviderAuthSettingsSchema = z.object({
  type: z.enum(IdentityProviderType),
  brand: z.string().min(5).max(50),
  client_id: z.string().min(10).max(100),
  client_secret: z.string().min(10).max(100),
  redirect_urls: z.array(z.url()).min(1).max(20),
  auto_link_users: z.boolean(),
  auto_create_users: z.boolean(),
  session_lifetime_hours: z.int().min(1).max(8760),
});

export const identityProviderSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  name: z.string().min(5).max(50),
  issuer_url: z.url(),
  audience: z.string().min(10).max(100),
  identifier_claim_name: z.string().min(3).max(20),
  auth_settings: identityProviderAuthSettingsSchema.nullable(),
});

export type IdentityProviderAuthSettingsDto = z.infer<typeof identityProviderAuthSettingsSchema>;
export type IdentityProviderDto = z.infer<typeof identityProviderSchema>;

const maskClientSecret = (clientSecret: string) => {
  return clientSecret.slice(0, -4).replace(/./g, '*') + clientSecret.slice(-4);
};

export const presentIdentityProviderAuthSettings = MapperBuilder.for<IdentityProviderAuthSettings>()
  .mapProperty('clientSecret', value => maskClientSecret(value))
  .datesToIsoString()
  .toSnakeCase()
  .build<IdentityProviderAuthSettingsDto>();

export const presentIdentityProvider = MapperBuilder.for<IdentityProvider>()
  .mapProperty('authSettings', value => (value ? presentIdentityProviderAuthSettings(value) : null))
  .datesToIsoString()
  .toSnakeCase()
  .build<IdentityProviderDto>();
