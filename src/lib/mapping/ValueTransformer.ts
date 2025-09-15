export type PascalCase<S extends string> = S extends `${infer P}_${infer Q}`
  ? `${Capitalize<P>}${PascalCase<Q>}`
  : Capitalize<S>

export type CamelCase<S extends string> = S extends `${infer P}_${infer Q}`
  ? `${Uncapitalize<P>}${Capitalize<CamelCase<Q>>}`
  : Uncapitalize<S>

export type SnakeCase<S extends string> = S extends `${infer P}${infer Q}`
  ? Q extends Uncapitalize<Q>
    ? `${Lowercase<P>}${SnakeCase<Q>}`
    : `${Lowercase<P>}_${SnakeCase<Q>}`
  : S

export type Prefix<S extends string, P extends string> = `${P}${S}`

export type Unprefix<S extends string, P extends string> = S extends `${P}${infer Rest}` ? Rest : S

// biome-ignore lint/complexity/noStaticOnlyClass: Avoid name overlap with ObjectTransformer
export class ValueTransformer {
  static prefix<T extends string, P extends string>(value: T, prefix: P): Prefix<T, P> {
    return `${prefix}${value}` as Prefix<T, P>
  }

  static unprefix<T extends string, P extends string>(value: T, prefix: P): Unprefix<T, P> {
    return value.startsWith(prefix) ? (value.slice(prefix.length) as Unprefix<T, P>) : (value as Unprefix<T, P>)
  }

  static toUpperCase<T extends string>(value: T): Uppercase<T> {
    return value.toUpperCase() as Uppercase<T>
  }

  static toLowerCase<T extends string>(value: T): Lowercase<T> {
    return value.toLowerCase() as Lowercase<T>
  }

  static toCamelCase<T extends string>(value: T): CamelCase<T> {
    return value.replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase()) as CamelCase<T>
  }

  static toSnakeCase<T extends string>(value: T): SnakeCase<T> {
    return value.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`) as SnakeCase<T>
  }

  static toPascalCase<T extends string>(value: T): PascalCase<T> {
    return value.replace(/(?:^[a-z]|_[a-z])/g, match => match.replace("_", "").toUpperCase()) as PascalCase<T>
  }
}
