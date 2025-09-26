import z from "zod"
import * as schemas from "./schemas"

export type SignInWithPasswordQuery = Readonly<z.input<typeof schemas.signInWithPasswordQuery>>
