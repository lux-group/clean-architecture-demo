import z from "zod"
import * as schemas from "./schemas"

export type SignInWithPasswordBody = Readonly<z.input<typeof schemas.signInWithPasswordBody>>
