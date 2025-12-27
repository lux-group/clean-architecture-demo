import z from 'zod';
import { Session, SessionStatus } from '~/domain/entities';
import { MapperBuilder } from '~/lib/MapperBuilder';

export const sessionSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  last_refresh_at: z.string(),
  expires_at: z.string(),
  terminated_at: z.string().nullable(),
  status: z.enum(SessionStatus),
  user_id: z.uuid(),
  identity_provider_id: z.uuid().nullable(),
  identity_provider_session_id: z.string().max(100).nullable(),
});

export type SessionDto = z.infer<typeof sessionSchema>;

export const presentSession = MapperBuilder.for<Session>()
  .omit('nonce', 'idToken', 'refreshToken')
  .datesToIsoString()
  .toSnakeCase()
  .build<SessionDto>();
