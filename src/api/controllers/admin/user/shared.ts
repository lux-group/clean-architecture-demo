import z from 'zod';
import { User, UserIdentity } from '~/domain/entities';
import { MapperBuilder } from '~/lib/MapperBuilder';

const userIdentitySchema = z.object({
  identity_provider_id: z.uuid(),
  identifier_claim_value: z.string().min(1).max(255),
});

export const userSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  is_enabled: z.boolean(),
  brand: z.string().min(1).max(50),
  given_name: z.string().min(1).max(50),
  surname: z.string().min(1).max(50),
  email: z.email().max(255),
  email_verified: z.boolean(),
  phone: z.string().min(4).max(15).nullable(),
  country: z.string().min(2).max(2).nullable(),
  city: z.string().min(4).max(50).nullable(),
  postcode: z.string().min(4).max(20).nullable(),
  roles: z.array(z.string().min(1).max(50)),
  identities: z.array(userIdentitySchema),
});

export type UserDto = z.infer<typeof userSchema>;

const toUserIdentityDto = MapperBuilder.for<UserIdentity>().omit('id').toSnakeCase().build();

export const presentUser = MapperBuilder.for<User>()
  .omit('passwordHash')
  .mapProperty('identities', identities => identities?.map(toUserIdentityDto))
  .datesToIsoString()
  .toSnakeCase()
  .build<UserDto>();
