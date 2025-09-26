import z from "zod"
import * as schemas from "./schemas"

export type IdParams = Readonly<z.input<typeof schemas.idParam>>
export type CreateBody = Readonly<z.input<typeof schemas.createBody>>
export type UpdateBody = Readonly<z.input<typeof schemas.updateBody>>
export type SingleResponse = Readonly<z.input<typeof schemas.singleResponse>>
export type PaginatedResponse = Readonly<z.input<typeof schemas.paginatedResponse>>
