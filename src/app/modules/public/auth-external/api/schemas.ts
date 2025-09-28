import z from "zod"

export const createSignInRequestQuery = z.object({
  provider: z.string().min(5).max(50),
  redirect_uri: z.url(),
})

export const createSignOutRequestQuery = z.object({
  redirect_uri: z.url(),
})
