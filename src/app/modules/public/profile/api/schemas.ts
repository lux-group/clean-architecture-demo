import z from "zod"

const profile = z.object({
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
})

export const singleResponse = profile
