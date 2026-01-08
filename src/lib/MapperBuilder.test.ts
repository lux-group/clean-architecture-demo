import { describe, expect, expectTypeOf, it } from 'vitest';
import { MapperBuilder } from './MapperBuilder';

type InputSimple = { a: number; b: string };
type InputSnake = {
  user_name: string;
  created_at: Date;
  nested_obj: { child_id: number; flags_list: Array<{ is_active: boolean; created_at: Date }> };
};
type InputCamel = {
  userName: string;
  createdAt: Date;
  nestedObj: { childId: number; flagsList: Array<{ isActive: boolean; createdAt: Date }> };
};

describe('MapperBuilder', () => {
  describe('map', () => {
    it('should transform the current object to a new strongly-typed shape', () => {
      const mapper = MapperBuilder.for<InputSimple>()
        .map(v => ({ x: v.a, y: Number(v.b.length) }))
        .build();

      const output = mapper({ a: 10, b: 'hello' });

      expect(output).toEqual({ x: 10, y: 5 });
      expectTypeOf(output).branded.toEqualTypeOf<{ x: number; y: number }>();
    });
  });

  describe('mapProperty', () => {
    it('should map a single property while preserving other properties and types', () => {
      const mapper = MapperBuilder.for<InputSimple>()
        .mapProperty('a', a => a.toString())
        .build();

      const output = mapper({ a: 42, b: 'bee' });

      expect(output).toEqual({ a: '42', b: 'bee' });
      expectTypeOf(output).branded.toEqualTypeOf<{ a: string; b: string }>();
    });
  });

  describe('pick', () => {
    it('should keep only the specified keys with correct resulting type', () => {
      const mapper = MapperBuilder.for<InputSimple>().pick('a').build();

      const output = mapper({ a: 7, b: 'discard' });

      expect(output).toEqual({ a: 7 });
      expectTypeOf(output).branded.toEqualTypeOf<Pick<InputSimple, 'a'>>();
    });
  });

  describe('omit', () => {
    it('should remove the specified keys with correct resulting type', () => {
      const mapper = MapperBuilder.for<InputSimple>().omit('b').build();

      const output = mapper({ a: 7, b: 'remove' });

      expect(output).toEqual({ a: 7 });
      expectTypeOf(output).branded.toEqualTypeOf<Omit<InputSimple, 'b'>>();
    });
  });

  describe('toCamelCase', () => {
    it('should transform snake_case keys to camelCase recursively with types updated', () => {
      const mapper = MapperBuilder.for<InputSnake>().toCamelCase().build<InputCamel>();

      const input: InputSnake = {
        user_name: 'john',
        created_at: new Date('2023-01-01T00:00:00.000Z'),
        nested_obj: {
          child_id: 123,
          flags_list: [
            { is_active: true, created_at: new Date('2023-01-02T00:00:00.000Z') },
            { is_active: false, created_at: new Date('2023-01-03T00:00:00.000Z') },
          ],
        },
      };

      const output = mapper(input);

      expect(output).toEqual({
        userName: 'john',
        createdAt: input.created_at,
        nestedObj: {
          childId: 123,
          flagsList: [
            { isActive: true, createdAt: input.nested_obj.flags_list[0].created_at },
            { isActive: false, createdAt: input.nested_obj.flags_list[1].created_at },
          ],
        },
      });

      expectTypeOf(output).branded.toEqualTypeOf<InputCamel>();
    });
  });

  describe('toSnakeCase', () => {
    it('should transform camelCase keys to snake_case recursively with types updated', () => {
      const mapper = MapperBuilder.for<InputCamel>().toSnakeCase().build<InputSnake>();

      const input: InputCamel = {
        userName: 'jane',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        nestedObj: {
          childId: 456,
          flagsList: [
            { isActive: true, createdAt: new Date('2024-02-01T00:00:00.000Z') },
            { isActive: false, createdAt: new Date('2024-03-01T00:00:00.000Z') },
          ],
        },
      };

      const output = mapper(input);

      expect(output).toEqual({
        user_name: 'jane',
        created_at: input.createdAt,
        nested_obj: {
          child_id: 456,
          flags_list: [
            { is_active: true, created_at: input.nestedObj.flagsList[0].createdAt },
            { is_active: false, created_at: input.nestedObj.flagsList[1].createdAt },
          ],
        },
      });

      expectTypeOf(output).branded.toEqualTypeOf<InputSnake>();
    });
  });

  describe('datesToIsoString', () => {
    it('should map all Date values to ISO strings recursively with types updated', () => {
      type WithDates = {
        id: string;
        at: Date;
        nested: { when: Date; arr: Array<Date | { inner: Date } | string> };
      };

      const mapper = MapperBuilder.for<WithDates>().datesToIsoString().build();

      const input: WithDates = {
        id: 'x',
        at: new Date('2025-01-01T00:00:00.000Z'),
        nested: {
          when: new Date('2025-01-02T00:00:00.000Z'),
          arr: [new Date('2025-01-03T00:00:00.000Z'), { inner: new Date('2025-01-04T00:00:00.000Z') }, 'keep'],
        },
      };

      const output = mapper(input);

      // Runtime assertions
      expect(typeof output.at).toBe('string');
      expect(typeof output.nested.when).toBe('string');
      expect(typeof output.nested.arr[0]).toBe('string');
      expect(typeof (output.nested.arr[1] as any).inner).toBe('string');
      expect(output.nested.arr[2]).toBe('keep');

      // Compile-time type assertions
      expectTypeOf(output).branded.toEqualTypeOf<{
        id: string;
        at: string;
        nested: { when: string; arr: Array<string | { inner: string } | string> };
      }>();
    });
  });
});
