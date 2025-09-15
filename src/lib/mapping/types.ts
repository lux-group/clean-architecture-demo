export type Primitive = string | number | bigint | boolean | Date | symbol | null | undefined

export type RealObject<T> = T extends Primitive ? never : T

export type NonFunctions<T> = T extends Array<infer U>
  ? Array<NonFunctions<U>>
  : T extends Primitive
    ? T
    : T extends object
      ? {
          [P in keyof T as T[P] extends Function ? never : P]: NonFunctions<T[P]>
        }
      : T

export type AllVariants<T> = T | Array<any> | ReadonlyArray<any> | Map<any, any>

export type AllVariants2<T> = T extends Array<any> | ReadonlyArray<any> | Map<any, any>
  ? T
  : T | Array<T> | ReadonlyArray<T> | Map<string, T>
