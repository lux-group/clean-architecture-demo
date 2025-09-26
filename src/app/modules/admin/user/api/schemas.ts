import z from "zod"

const userIdentity = z.object({
  identity_provider_id: z.uuid(),
  identifier_claim_value: z.string().min(1).max(255),
})

const user = z.object({
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
  identities: z.array(userIdentity),
})

export const idParam = z.object({
  id: z.uuid(),
})

export const createBody = user
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    email_verified: true,
    identities: true,
  })
  .extend({
    password: z.string(),
  })

export const updateBody = user.omit({
  id: true,
  created_at: true,
  updated_at: true,
  brand: true,
  email: true,
  email_verified: true,
  phone: true,
  identities: true,
})

export const singleResponse = user

export const paginatedResponse = z.object({
  total: z.int(),
  items: z.array(user),
})
