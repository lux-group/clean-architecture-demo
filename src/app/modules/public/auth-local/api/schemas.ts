import z from "zod"

export const signInWithPasswordQuery = z.object({
  email: z.email(),
  password: z.string().min(5).max(50),
  brand: z.string().min(5).max(50),
})
