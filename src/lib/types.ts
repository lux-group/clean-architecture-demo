export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Readonly<infer U>[]
      ? Readonly<DeepPartial<U>>[]
      : DeepPartial<T[P]>;
};

export type Where<T> =
  | {
      operator: 'equals' | 'not-equals';
      property: keyof T;
      value: string | number | Date | boolean | null;
    }
  | {
      operator: 'in' | 'not-in';
      property: keyof T;
      values: (string | number)[];
    }
  | {
      operator: 'contains' | 'starts-with' | 'ends-with';
      property: keyof T;
      value: string;
    }
  | {
      operator: 'greater-than' | 'less-than';
      property: keyof T;
      value: number | Date;
    }
  | {
      operator: 'and' | 'or';
      filters: Where<T>[];
    }
  | {
      operator: 'not';
      filter: Where<T>;
    };

export type OrderBy<T> = {
  property: keyof T;
  direction: 'asc' | 'desc';
};

export type Query<T> = {
  limit: number;
  offset: number;
  orderBy?: OrderBy<T>;
  where?: Where<T>;
  select?: (keyof T)[];
};

export type QueryResult<T> = {
  items: T[];
  total: number;
};
