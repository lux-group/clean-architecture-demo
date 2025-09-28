import z from "zod"

const signingKey = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  public_key: z.string().min(1).max(10000),
})

export const idParam = z.object({
  id: z.uuid(),
})

export const singleResponse = signingKey

export const paginatedResponse = z.object({
  total: z.int(),
  items: z.array(signingKey),
})
