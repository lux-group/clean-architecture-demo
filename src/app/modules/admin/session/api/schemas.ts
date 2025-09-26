import z from "zod"
import { SessionStatus } from "~/domain/entities"

const session = z.object({
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
})

export const idParam = z.object({
  id: z.uuid(),
})

export const singleResponse = session

export const paginatedResponse = z.object({
  total: z.int(),
  items: z.array(session),
})
