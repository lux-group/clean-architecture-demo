import z from "zod"
import { IdentityProviderType } from "~/domain/entities"

const identityProviderAuthSettings = z.object({
  type: z.enum(IdentityProviderType),
  brand: z.string().min(5).max(50),
  client_id: z.string().min(10).max(100),
  client_secret: z.string().min(10).max(100),
  redirect_urls: z.array(z.url()).min(1).max(20),
  auto_link_users: z.boolean().default(false),
  auto_create_users: z.boolean().default(false),
})

const identityProvider = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  name: z.string().min(5).max(50),
  issuer_url: z.url(),
  audience: z.string().min(10).max(100),
  identifier_claim_name: z.string().min(3).max(20),
  auth_settings: identityProviderAuthSettings.nullable(),
})

export const idParam = z.object({
  id: z.uuid(),
})

export const createBody = identityProvider.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateBody = identityProvider.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const singleResponse = identityProvider

export const paginatedResponse = z.object({
  total: z.int(),
  items: z.array(identityProvider),
})
