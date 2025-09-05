import { OrderBy, Query, Where } from "~/lib/types"

type PrismaFindManyArgs<T> = {
  skip: number
  take: number
  orderBy?: PrismaOrderByInput<T>
  where?: PrismaWhereInput<T>
  select?: PrismaSelectInput<T>
  include?: PrismaSelectInput<T>
}

type PrismaSelectInput<T> = {
  [P in keyof T]?: boolean
}

type PrismaOrderByInput<T> = {
  [P in keyof T]?: "asc" | "desc"
}

type PrismaWhereInput<T> = {
  AND?: Array<PrismaWhereInput<T>>
  OR?: Array<PrismaWhereInput<T>>
  NOT?: PrismaWhereInput<T>
} & {
  [P in keyof T]?: unknown
}

export function mapQuery<T extends object>(query: Query<T>, include?: (keyof T)[]): PrismaFindManyArgs<T> {
  const find: PrismaFindManyArgs<T> = {
    skip: query.offset,
    take: query.limit,
    orderBy: mapOrderBy(query.orderBy),
    where: mapWhere(query.where),
    select: mapSelect(query.select),
  }

  if (include) {
    if (find.select) {
      include.forEach(key => (find.select![key] = true))
    } else {
      find.include = mapSelect(include)
    }
  }

  return find
}

export function mapSelect<T extends object>(select?: (keyof T)[]): PrismaSelectInput<T> | undefined {
  if (!select) {
    return undefined
  }

  return select?.reduce(
    (acc, key) => {
      acc[key] = true
      return acc
    },
    {} as PrismaSelectInput<T>,
  )
}

export function mapOrderBy<T extends object>(orderBy?: OrderBy<T>): PrismaOrderByInput<T> | undefined {
  if (!orderBy) {
    return undefined
  }

  return { [orderBy.property]: orderBy.direction } as PrismaOrderByInput<T>
}

export function mapWhere<T extends object>(where?: Where<T>): PrismaWhereInput<T> | undefined {
  if (!where) {
    return undefined
  }

  switch (where.operator) {
    case "equals":
      return { [where.property]: { equals: where.value } } as PrismaWhereInput<T>
    case "not-equals":
      return { [where.property]: { not: where.value } } as PrismaWhereInput<T>
    case "in":
      return { [where.property]: { in: where.values } } as PrismaWhereInput<T>
    case "not-in":
      return { [where.property]: { notIn: where.values } } as PrismaWhereInput<T>
    case "contains":
      return { [where.property]: { contains: where.value } } as PrismaWhereInput<T>
    case "starts-with":
      return { [where.property]: { startsWith: where.value } } as PrismaWhereInput<T>
    case "ends-with":
      return { [where.property]: { endsWith: where.value } } as PrismaWhereInput<T>
    case "greater-than":
      return { [where.property]: { gt: where.value } } as PrismaWhereInput<T>
    case "less-than":
      return { [where.property]: { lt: where.value } } as PrismaWhereInput<T>
    case "and":
      return { AND: where.filters.map(filter => mapWhere(filter)) } as PrismaWhereInput<T>
    case "or":
      return { OR: where.filters.map(filter => mapWhere(filter)) } as PrismaWhereInput<T>
    case "not":
      return { NOT: mapWhere(where.filter) } as PrismaWhereInput<T>
    default:
      throw new Error("Unsupported operator")
  }
}
