import { ParsedQs } from 'qs';
import { InvalidOperationError } from '~/domain/errors';
import { toCamelCase, toSnakeCase } from '~/lib/transformObject';
import { Query, Where } from '~/lib/types';

function mapFieldName<T>(name: string): keyof T {
  return toCamelCase(name) as keyof T;
}

export function parseQuery<T>(
  query: ParsedQs,
  supportedOrderByProperties: (keyof T)[] = [],
  supportedWhereProperties: (keyof T)[] = [],
  defaultLimit: number = 50,
): Query<T> {
  const parsedQuery: Query<T> = {
    offset: Number(query.offset) || 0,
    limit: Number(query.limit) || defaultLimit,
  };

  if (query.order_by) {
    const orderBy = mapFieldName(query.order_by as string);
    if (!supportedOrderByProperties.includes(orderBy)) {
      throw new InvalidOperationError(`Unsupported order by field: ${orderBy}`);
    }

    parsedQuery.orderBy = {
      property: orderBy,
      direction: query.order_direction === 'desc' ? 'desc' : 'asc',
    };
  }

  if (query.select) {
    parsedQuery.select = (query.select as string).split(',').map(s => mapFieldName(s));
  }

  const filters = supportedWhereProperties
    .map(property => ({ property, value: query[toSnakeCase(property as string)] as unknown }))
    .filter(({ value }) => value !== undefined)
    .map(({ property, value }) => {
      if (typeof value === 'string') {
        if (value.startsWith('*') && value.endsWith('*')) {
          return { operator: 'contains', property, value: value.slice(1, -1) } as Where<T>;
        }
        if (value.startsWith('*')) {
          return { operator: 'ends-with', property, value: value.slice(1) } as Where<T>;
        }
        if (value.endsWith('*')) {
          return { operator: 'starts-with', property, value: value.slice(0, -1) } as Where<T>;
        }
      }
      return { operator: 'equals', property, value } as Where<T>;
    });

  if (filters.length > 0) {
    parsedQuery.where = filters.length === 1 ? filters[0] : { operator: 'and', filters };
  }

  return parsedQuery;
}
