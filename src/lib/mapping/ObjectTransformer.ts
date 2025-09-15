import { RealObject } from "./types"
import { CamelCase, PascalCase, Prefix, SnakeCase, Unprefix, ValueTransformer } from "./ValueTransformer"

export type UpperCaseObject<T> = T extends Array<infer U>
  ? Array<UpperCaseObject<U>>
  : T extends RealObject<T>
    ? {
        [K in keyof T as Uppercase<string & K>]: UpperCaseObject<T[K]>
      }
    : T

export type LowerCaseObject<T> = T extends Array<infer U>
  ? Array<LowerCaseObject<U>>
  : T extends RealObject<T>
    ? {
        [K in keyof T as Lowercase<string & K>]: LowerCaseObject<T[K]>
      }
    : T

export type PascalCaseObject<T> = T extends Array<infer U>
  ? Array<PascalCaseObject<U>>
  : T extends RealObject<T>
    ? {
        [K in keyof T as PascalCase<string & K>]: PascalCaseObject<T[K]>
      }
    : T

export type CamelCaseObject<T> = T extends Array<infer U>
  ? Array<CamelCaseObject<U>>
  : T extends RealObject<T>
    ? {
        [K in keyof T as CamelCase<string & K>]: CamelCaseObject<T[K]>
      }
    : T

export type SnakeCaseObject<T> = T extends Array<infer U>
  ? Array<SnakeCaseObject<U>>
  : T extends RealObject<T>
    ? {
        [K in keyof T as SnakeCase<string & K>]: SnakeCaseObject<T[K]>
      }
    : T

export type PrefixObject<T, P extends string> = T extends Array<infer U>
  ? Array<PrefixObject<U, P>>
  : T extends RealObject<T>
    ? {
        [K in keyof T as Prefix<string & K, P>]: PrefixObject<T[K], P>
      }
    : T

export type UnprefixObject<T, P extends string> = T extends Array<infer U>
  ? Array<UnprefixObject<U, P>>
  : T extends RealObject<T>
    ? {
        [K in keyof T as Unprefix<string & K, P>]: UnprefixObject<T[K], P>
      }
    : T

export type PickByPrefix<T, P extends string> = {
  [K in keyof T as K extends string
    ? P extends string
      ? K extends `${P}${infer PropName}`
        ? Uncapitalize<PropName>
        : never
      : K
    : never]: T[K]
}

export type OmitByPrefix<T, P extends string> = {
  [K in keyof T as K extends string
    ? P extends `${infer Prefix}${any}`
      ? K extends `${Prefix}${any}`
        ? never
        : K
      : K
    : never]: T[K]
}

// export type ReplacePropertyType<T, From, To> = T extends From
//   ? To
//   : T extends (infer U)[]
//     ? ReplacePropertyType<U, From, To>[]
//     : T extends object
//       ? {
//           [K in keyof T]: ReplacePropertyType<T[K], From, To>
//         }
//       : T

export type FlattenObject<T extends object, K extends string & keyof T> = Omit<T, K> &
  PrefixObject<{ [P in keyof T[K] as Capitalize<string & P>]: T[K][P] }, K>

// biome-ignore lint/complexity/noStaticOnlyClass: Avoid name overlap with ValueTransformer
export class ObjectTransformer {
  static merge<T extends object, M extends object>(obj: T, merge: M): T & M {
    return { ...obj, ...merge }
  }

  static pick<T extends object, K extends string & keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return Object.fromEntries(Object.entries(obj).filter(i => (keys as string[]).includes(i[0]))) as Pick<T, K>
  }

  static pickWithPrefix<T extends object, K extends string>(obj: T, ...prefixes: K[]): PickByPrefix<T, K> {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([key]) => prefixes.some(prefix => key.startsWith(prefix)))
        .map(([key, value]) => {
          const prefix = prefixes.find(p => key.startsWith(p))!
          const newKey = key.slice(prefix.length)
          return [newKey.charAt(0).toLowerCase() + newKey.slice(1), value]
        }),
    ) as PickByPrefix<T, K>
  }

  static omit<T extends object, K extends string & keyof T>(obj: T, keys: K[]): Omit<T, K> {
    return Object.fromEntries(Object.entries(obj).filter(i => !(keys as string[]).includes(i[0]))) as Omit<T, K>
  }

  static omitWithPrefix<T extends object, K extends string>(obj: T, ...prefixes: K[]): OmitByPrefix<T, K> {
    return Object.fromEntries(
      Object.entries(obj).filter(i => !prefixes.some(prefix => i[0].startsWith(prefix))),
    ) as OmitByPrefix<T, K>
  }

  static flatten<T extends object, K extends string & keyof T>(obj: T, keys: K[]): FlattenObject<T, K> {
    keys.forEach(
      key => (obj = ObjectTransformer.merge(obj, ObjectTransformer.prefix(ObjectTransformer.toPascalCase(obj), key))),
    )
    return ObjectTransformer.omit(obj, keys) as FlattenObject<T, K>
  }

  static toUpperCase<T extends object>(obj: T): UpperCaseObject<T> {
    return ObjectTransformer.transformKeys(obj, s => ValueTransformer.toUpperCase(s))
  }

  static toLowerCase<T extends object>(obj: T): LowerCaseObject<T> {
    return ObjectTransformer.transformKeys(obj, s => ValueTransformer.toLowerCase(s))
  }

  static toPascalCase<T extends object>(obj: T): PascalCaseObject<T> {
    return ObjectTransformer.transformKeys(obj, s => ValueTransformer.toPascalCase(s))
  }

  static toCamelCase<T extends object>(obj: T): CamelCaseObject<T> {
    return ObjectTransformer.transformKeys(obj, s => ValueTransformer.toCamelCase(s))
  }

  static toSnakeCase<T extends object>(obj: T): SnakeCaseObject<T> {
    return ObjectTransformer.transformKeys(obj, s => ValueTransformer.toSnakeCase(s))
  }

  static prefix<T extends object, P extends string>(obj: T, prefix: P): PrefixObject<T, P> {
    return ObjectTransformer.transformKeys(obj, s => ValueTransformer.prefix(s, prefix))
  }

  static unprefix<T extends object, P extends string>(obj: T, prefix: P): UnprefixObject<T, P> {
    return ObjectTransformer.transformKeys(obj, s => ValueTransformer.unprefix(s, prefix))
  }

  static transformKeys<T extends object, Result extends object>(obj: T, transformKey: (key: string) => string): Result {
    if (Array.isArray(obj)) {
      return obj.map(item =>
        item !== null && typeof item === "object" ? ObjectTransformer.transformKeys(item, transformKey) : item,
      ) as Result
    }

    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      const transformedKey = transformKey(key)
      acc[transformedKey] =
        value && typeof value === "object" ? ObjectTransformer.transformKeys(value, transformKey) : value
      return acc
    }, {} as Result)
  }

  // static transformValues<T extends object, Result extends object>(
  //   obj: T,
  //   transformValue: (value: unknown) => unknown,
  // ): Result {
  //   if (Array.isArray(obj)) {
  //     return obj.map(item =>
  //       item !== null && typeof item === "object" ? ObjectTransformer.transformValues(item, transformValue) : item,
  //     ) as Result
  //   }

  //   return Object.entries(obj).reduce((acc: any, [key, value]) => {
  //     const transformedValue = transformValue(value)
  //     acc[key] =
  //       transformedValue && typeof transformedValue === "object"
  //         ? ObjectTransformer.transformValues(transformedValue, transformValue)
  //         : transformedValue
  //     return acc
  //   }, {} as Result)
  // }
}
