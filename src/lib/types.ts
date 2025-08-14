export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Readonly<infer U>[]
      ? Readonly<DeepPartial<U>>[]
      : DeepPartial<T[P]>
}

export type Query<T> = {
  limit: number
  offset: number
  orderBy?: keyof T
  orderDirection?: "asc" | "desc"
  where?: Record<keyof T, any>
}

export type QueryResult<T> = {
  items: T[]
  total: number
}
