import z from "zod"
import * as schemas from "./schemas"

export type CreateSignInRequestQuery = Readonly<z.input<typeof schemas.createSignInRequestQuery>>
export type CreateSignOutRequestQuery = Readonly<z.input<typeof schemas.createSignOutRequestQuery>>
