import {
  CamelCaseObject,
  FlattenObject,
  LowerCaseObject,
  ObjectTransformer,
  PascalCaseObject,
  PickByPrefix,
  PrefixObject,
  SnakeCaseObject,
  UnprefixObject,
  UpperCaseObject,
} from "./ObjectTransformer"

export type Mapper<In extends object, Out extends object> = (input: In) => Out

export class MapperBuilder<Start extends object, Current extends object> {
  constructor(private readonly actions: ((input: object) => object)[]) {}

  static for<Start extends object>(): MapperBuilder<Start, Start> {
    return new MapperBuilder<Start, Start>([])
  }

  create<End extends Current>(): Mapper<Start, Current> {
    return (input: Start) => [...this.actions].reduce((v: any, a) => a(v), input) as End
  }

  addProperty<K extends string, V>(key: K, value: V) {
    return this.merge(_ => ({ [key]: value }))
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

  merge<M extends object>(action: (obj: Current) => M): MapperBuilder<Start, Current & M> {
    return this.append(input => ObjectTransformer.merge(input, action(input)))
  }

  pick<K extends string & keyof Current>(...keys: K[]): MapperBuilder<Start, Pick<Current, K>> {
    return this.append(input => ObjectTransformer.pick(input, keys))
  }

  omit<K extends string & keyof Current>(...keys: K[]): MapperBuilder<Start, Omit<Current, K>> {
    return this.append(input => ObjectTransformer.omit(input, keys))
  }

  flattenCompositeProperties<K extends string & keyof Current>(
    ...keys: K[]
  ): MapperBuilder<Start, FlattenObject<Current, K>> {
    return this.append(input => ObjectTransformer.flatten(input, keys))
  }

  mapToCompositeProperty<K extends string, Mapped extends object>(
    prefix: K,
    action: (obj: PickByPrefix<Current, K>) => Mapped,
  ): MapperBuilder<Start, Omit<Current, `${K}${string}`> & { [P in K]: Mapped }> {
    return this.append(input => {
      const extracted = ObjectTransformer.pickWithPrefix(input, prefix)
      const remaining = ObjectTransformer.omitWithPrefix(input, prefix)
      const result = { ...remaining, [prefix]: action(extracted) }
      return result as unknown as Omit<Current, `${K}${string}`> & { [P in K]: Mapped }
    })
  }

  prefix<P extends string>(prefix: P): MapperBuilder<Start, PrefixObject<Current, P>> {
    return this.append(input => ObjectTransformer.prefix(input, prefix))
  }

  unprefix<P extends string>(prefix: P): MapperBuilder<Start, UnprefixObject<Current, P>> {
    return this.append(input => ObjectTransformer.unprefix(input, prefix))
  }

  toUpperCase(): MapperBuilder<Start, UpperCaseObject<Current>> {
    return this.append(input => ObjectTransformer.toUpperCase(input))
  }

  toLowerCase(): MapperBuilder<Start, LowerCaseObject<Current>> {
    return this.append(input => ObjectTransformer.toLowerCase(input))
  }

  toPascalCase(): MapperBuilder<Start, PascalCaseObject<Current>> {
    return this.append(input => ObjectTransformer.toPascalCase(input))
  }

  toCamelCase(): MapperBuilder<Start, CamelCaseObject<Current>> {
    return this.append(input => ObjectTransformer.toCamelCase(input))
  }

  toSnakeCase(): MapperBuilder<Start, SnakeCaseObject<Current>> {
    return this.append(input => ObjectTransformer.toSnakeCase(input))
  }

  private append<Next extends object>(action: (input: Current) => Next): MapperBuilder<Start, Next> {
    return new MapperBuilder<Start, Next>([...(this.actions as any), action])
  }
}
