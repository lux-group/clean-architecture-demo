import z from "zod"
import * as schemas from "./schemas"

export type SingleResponse = Readonly<z.input<typeof schemas.singleResponse>>
