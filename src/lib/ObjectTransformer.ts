export type KeyTransformer = (key: string) => string;
export type ValueTransformer = (value: any) => any;

export class ObjectTransformer {
  public static transform(obj: any, keyTransformers: KeyTransformer[], valueTransformers: ValueTransformer[]): any {
    if (Array.isArray(obj)) {
      return obj.map(item => ObjectTransformer.transform(item, keyTransformers, valueTransformers))
    }

    if (obj === null || obj instanceof Date || typeof obj !== "object") {
      return valueTransformers.reduce((acc, transformer) => transformer(acc), obj)
    }

    return Object.keys(obj).reduce((result, key) => {
      const transformKey = keyTransformers.reduce((res, transformer) => transformer(res), key)
      const transformedValue = ObjectTransformer.transform(obj[key], keyTransformers, valueTransformers)
      result[transformKey] = transformedValue
      return result
    }, {} as Record<string, any>)
  }
}

export function toCamelCase(key: any) {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

export function toSnakeCase(key: any) {
  return key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`)
}

export function toISODateString(value: any) {
  return value instanceof Date ? value.toISOString() : value
}

export function toDateObject(value: any) {
  return typeof value === "string" && !isNaN(Date.parse(value)) ? new Date(value) : value
}
