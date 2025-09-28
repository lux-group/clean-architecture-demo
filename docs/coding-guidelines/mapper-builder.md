# MapperBuilder

## Introduction

The `src/lib/MapperBuilder.ts` is a utility class to make mapping data between schemas simple and safe.

## Example

```ts
type DomainUser = {
  id: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

type APIUser = {
  id: string
  email: string
  created_at: String
  updated_at: String
}

const presentUser = MapperBuilder.for<DomainUser>()
  .omit("passwordHash")
  .datesToIsoString()
  .toSnakeCase()
  .build<APIUser>()

const apiUser = presentUser(domainUser)
```
