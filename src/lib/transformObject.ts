export type KeyTransformer = (key: string) => string;
export type ValueTransformer = (value: any) => any;

export function transformObject(
  obj: any,
  keyTransformers: KeyTransformer[],
  valueTransformers: ValueTransformer[],
): any {
  if (Array.isArray(obj)) {
    return obj.map(item => transformObject(item, keyTransformers, valueTransformers));
  }

  if (obj === null || obj instanceof Date || typeof obj !== 'object') {
    return valueTransformers.reduce((acc, transformer) => transformer(acc), obj);
  }

  return Object.keys(obj).reduce(
    (result, key) => {
      const transformKey = keyTransformers.reduce((res, transformer) => transformer(res), key);
      const transformedValue = transformObject(obj[key], keyTransformers, valueTransformers);
      result[transformKey] = transformedValue;
      return result;
    },
    {} as Record<string, any>,
  );
}

export function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
}

export function toSnakeCase(key: string) {
  return key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
}

export function toISODateString(value: any) {
  return value instanceof Date ? value.toISOString() : value;
}

export function toDateObject(value: any) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value) : value;
}
