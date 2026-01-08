import z from 'zod';
import { SigningKey } from '~/domain/entities';
import { MapperBuilder } from '~/lib/MapperBuilder';

export const signingKeySchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  public_key: z.string().min(1).max(10000),
});

export type SigningKeyDto = z.infer<typeof signingKeySchema>;

export const presentSigningKey = MapperBuilder.for<SigningKey>()
  .omit('privateKey')
  .datesToIsoString()
  .toSnakeCase()
  .build<SigningKeyDto>();
