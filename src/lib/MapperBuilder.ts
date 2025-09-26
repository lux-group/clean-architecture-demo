import { toCamelCase, toSnakeCase, transformObject } from "./transformObject"

export type CamelCase<S extends string> = S extends `${infer P}_${infer Q}`
  ? `${Uncapitalize<P>}${Capitalize<CamelCase<Q>>}`
  : Uncapitalize<S>

export type SnakeCase<S extends string> = S extends `${infer P}${infer Q}`
  ? Q extends Uncapitalize<Q>
    ? `${Lowercase<P>}${SnakeCase<Q>}`
    : `${Lowercase<P>}_${SnakeCase<Q>}`
  : S

export type CamelCaseObject<T> = T extends Array<infer U>
  ? Array<CamelCaseObject<U>>
  : T extends object
    ? {
        [K in keyof T as CamelCase<string & K>]: CamelCaseObject<T[K]>
      }
    : T

export type SnakeCaseObject<T> = T extends Array<infer U>
  ? Array<SnakeCaseObject<U>>
  : T extends object
    ? {
        [K in keyof T as SnakeCase<string & K>]: SnakeCaseObject<T[K]>
      }
    : T

export type Mapper<In extends object, Out extends object> = (input: In) => Out

export class MapperBuilder<Start extends object, Current extends object> {
  constructor(private readonly actions: ((input: object) => object)[]) {}

  static for<Start extends object>(): MapperBuilder<Start, Start> {
    return new MapperBuilder<Start, Start>([])
  }

  create<End extends Current>(): Mapper<Start, Current> {
    return (input: Start) => [...this.actions].reduce((v: any, a) => a(v), input) as End
  }

  omitProperties<K extends string & keyof Current>(key: K) {
    return this.omit(key)
  }

  mapProperty<K extends string & keyof Current, Result>(
    key: K,
    action: (obj: Current[K]) => Result,
  ): MapperBuilder<Start, Omit<Current, K> & { [P in K]: Result }> {
    return this.map(data => ({ ...data, [key]: action(data[key]) }))
  }

  map<Result extends object>(action: (obj: Current) => Result): MapperBuilder<Start, Result> {
    return this.append(action)
  }

  pick<K extends string & keyof Current>(...keys: K[]): MapperBuilder<Start, Pick<Current, K>> {
    return this.append(
      input =>
        Object.fromEntries(Object.entries(input).filter(i => (keys as string[]).includes(i[0]))) as Pick<Current, K>,
    )
  }

  omit<K extends string & keyof Current>(...keys: K[]): MapperBuilder<Start, Omit<Current, K>> {
    return this.append(
      input =>
        Object.fromEntries(Object.entries(input).filter(i => !(keys as string[]).includes(i[0]))) as Omit<Current, K>,
    )
  }

  toCamelCase(): MapperBuilder<Start, CamelCaseObject<Current>> {
    return this.append(input => transformObject(input, [toCamelCase], []))
  }

  toSnakeCase(): MapperBuilder<Start, SnakeCaseObject<Current>> {
    return this.append(input => transformObject(input, [toSnakeCase], []))
  }

  private append<Next extends object>(action: (input: Current) => Next): MapperBuilder<Start, Next> {
    return new MapperBuilder<Start, Next>([...(this.actions as any), action])
  }
}
