import { Muscle } from '../core/Muscle';
import { MuscleGroup } from '../core/MuscleGroup';
import { MuscleMemory } from '../core/MuscleMemory';
import {
  ComputeMuscle,
  TransformMuscle,
  AggregateMuscle,
  FilterMuscle,
  SortMuscle,
  MapMuscle,
  ReduceMuscle,
} from '../built-in';

describe('Edge Cases and Error Handling', () => {
  describe('Muscle Edge Cases', () => {
    it('should handle null input', () => {
      const muscle = new Muscle('identity', (...args: unknown[]) => args[0]);
      expect(muscle.execute(null)).toBe(null);
    });

    it('should handle undefined input', () => {
      const muscle = new Muscle('identity', (...args: unknown[]) => args[0]);
      expect(muscle.execute(undefined)).toBe(undefined);
    });

    it('should handle empty string', () => {
      const upper = TransformMuscle.toUpperCase();
      expect(upper.execute('')).toBe('');
    });

    it('should handle empty array', () => {
      const sum = AggregateMuscle.sum();
      expect(sum.execute([])).toBe(0);
    });

    it('should handle single element array', () => {
      const sum = AggregateMuscle.sum();
      expect(sum.execute([42])).toBe(42);
    });

    it('should handle very large numbers', () => {
      const add = ComputeMuscle.add();
      const result = add.execute(Number.MAX_SAFE_INTEGER - 1, 1);
      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative numbers', () => {
      const abs = ComputeMuscle.abs();
      expect(abs.execute(-42)).toBe(42);
      expect(abs.execute(-0)).toBe(0);
    });

    it('should handle decimal numbers', () => {
      const round = ComputeMuscle.round();
      expect(round.execute(3.14159)).toBe(3);
      expect(round.execute(2.5)).toBe(3);
      expect(round.execute(2.49)).toBe(2);
    });

    it('should handle division by zero', () => {
      const divide = ComputeMuscle.divide();
      expect(divide.execute(10, 0)).toBe(Infinity);
      expect(divide.execute(-10, 0)).toBe(-Infinity);
    });

    it('should handle zero operations', () => {
      const multiply = ComputeMuscle.multiply();
      expect(multiply.execute(0, 5)).toBe(0);
      expect(multiply.execute(5, 0)).toBe(0);
    });
  });

  describe('MuscleGroup Edge Cases', () => {
    it('should handle empty sequential pipeline', async () => {
      const pipeline = MuscleGroup.sequential([]);
      expect(await pipeline.execute(42)).toBe(42);
    });

    it('should handle single muscle in pipeline', async () => {
      const double = new Muscle('double', (...args: unknown[]) => {
        const x = args[0] as number;
        return x * 2;
      });
      const pipeline = MuscleGroup.sequential([double]);
      expect(await pipeline.execute(5)).toBe(10);
    });

    it('should handle empty parallel group', async () => {
      const parallel = MuscleGroup.parallel([]);
      expect(await parallel.execute(42)).toEqual([]);
    });

    it('should handle nested pipelines', async () => {
      const inner = MuscleGroup.sequential([
        new Muscle('add1', (...args: unknown[]) => {
          const x = args[0] as number;
          return x + 1;
        }),
        new Muscle('double', (...args: unknown[]) => {
          const x = args[0] as number;
          return x * 2;
        }),
      ]);

      const outer = MuscleGroup.sequential([
        inner,
        new Muscle('subtract5', (...args: unknown[]) => {
          const x = args[0] as number;
          return x - 5;
        }),
      ]);

      // (5 + 1) * 2 - 5 = 7
      expect(await outer.execute(5)).toBe(7);
    });

    it('should handle deeply nested groups', async () => {
      const level3 = MuscleGroup.sequential([
        new Muscle('add1', (...args: unknown[]) => {
          const x = args[0] as number;
          return x + 1;
        }),
      ]);

      const level2 = MuscleGroup.sequential([
        level3,
        new Muscle('double', (...args: unknown[]) => {
          const x = args[0] as number;
          return x * 2;
        }),
      ]);
      const level1 = MuscleGroup.sequential([
        level2,
        new Muscle('add10', (...args: unknown[]) => {
          const x = args[0] as number;
          return x + 10;
        }),
      ]);

      // (5 + 1) * 2 + 10 = 22
      expect(await level1.execute(5)).toBe(22);
    });
  });

  describe('MuscleMemory Edge Cases', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle cache with zero maxSize', () => {
      const cache = new MuscleMemory<string>({ maxSize: 0 });
      cache.set('key1', 'value1');
      // With maxSize 0, all entries get evicted immediately
      expect(cache.size()).toBeLessThanOrEqual(1);
    });

    it('should handle cache with maxSize of 1', () => {
      const cache = new MuscleMemory<string>({ maxSize: 1 });
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(1);
      expect(cache.has('key1')).toBe(false); // Evicted
      expect(cache.has('key2')).toBe(true);
    });

    it('should handle multiple gets in a row', () => {
      const cache = new MuscleMemory<string>();
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key1')).toBe('value1');

      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
    });

    it('should handle cache with special characters in keys', () => {
      const cache = new MuscleMemory<string>();
      const specialKey = 'key:with:colons/and/slashes?and&special=chars';

      cache.set(specialKey, 'value');
      expect(cache.get(specialKey)).toBe('value');
    });

    it('should handle cache invalidation with no matches', () => {
      const cache = new MuscleMemory<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.invalidatePattern(/nomatch/);

      expect(cache.size()).toBe(2); // Nothing invalidated
    });

    it('should handle cache invalidation with all matches', () => {
      const cache = new MuscleMemory<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.invalidatePattern(/key/);

      expect(cache.size()).toBe(0); // Everything invalidated
    });
  });

  describe('Built-in Muscles Edge Cases', () => {
    describe('ComputeMuscle', () => {
      it('should handle sqrt of negative number', () => {
        const sqrt = ComputeMuscle.sqrt();
        expect(isNaN(sqrt.execute(-1))).toBe(true);
      });

      it('should handle modulo with negative numbers', () => {
        const mod = ComputeMuscle.modulo();
        expect(mod.execute(-10, 3)).toBe(-1);
        expect(mod.execute(10, -3)).toBe(1);
      });

      it('should handle power with negative exponent', () => {
        const pow = ComputeMuscle.power();
        expect(pow.execute(2, -2)).toBe(0.25);
      });

      it('should handle power with zero exponent', () => {
        const pow = ComputeMuscle.power();
        expect(pow.execute(10, 0)).toBe(1);
        expect(pow.execute(0, 0)).toBe(1);
      });
    });

    describe('TransformMuscle', () => {
      it('should handle JSON parse of invalid JSON', () => {
        const parse = TransformMuscle.parseJSON();
        expect(() => parse.execute('invalid json')).toThrow();
      });

      it('should handle JSON stringify of circular reference', () => {
        const stringify = TransformMuscle.stringifyJSON();
        const circular: { a: number; self?: unknown } = { a: 1 };
        circular.self = circular;
        expect(() => stringify.execute(circular)).toThrow();
      });

      it('should handle split with empty separator', () => {
        const split = TransformMuscle.split('');
        expect(split.execute('hello')).toEqual(['h', 'e', 'l', 'l', 'o']);
      });

      it('should handle split with non-existent separator', () => {
        const split = TransformMuscle.split('|');
        expect(split.execute('hello')).toEqual(['hello']);
      });

      it('should handle join of empty array', () => {
        const join = TransformMuscle.join(',');
        expect(join.execute([])).toBe('');
      });
    });

    describe('AggregateMuscle', () => {
      it('should handle average of empty array', () => {
        const avg = AggregateMuscle.average();
        expect(avg.execute([])).toBe(0);
      });

      it('should handle min/max of empty array', () => {
        const min = AggregateMuscle.min();
        const max = AggregateMuscle.max();

        expect(min.execute([])).toBe(Infinity);
        expect(max.execute([])).toBe(-Infinity);
      });

      it('should handle first/last of empty array', () => {
        const first = AggregateMuscle.first();
        const last = AggregateMuscle.last();

        expect(first.execute([])).toBeUndefined();
        expect(last.execute([])).toBeUndefined();
      });
    });

    describe('FilterMuscle', () => {
      it('should handle filter that matches nothing', () => {
        const filter = FilterMuscle.greaterThan(100);
        expect(filter.execute([1, 2, 3])).toEqual([]);
      });

      it('should handle filter that matches everything', () => {
        const filter = FilterMuscle.lessThan(100);
        expect(filter.execute([1, 2, 3])).toEqual([1, 2, 3]);
      });

      it('should handle unique with all duplicates', () => {
        const unique = FilterMuscle.unique();
        expect(unique.execute([1, 1, 1, 1])).toEqual([1]);
      });

      it('should handle unique with no duplicates', () => {
        const unique = FilterMuscle.unique();
        expect(unique.execute([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
      });
    });

    describe('SortMuscle', () => {
      it('should handle sort of empty array', () => {
        const sort = SortMuscle.ascending();
        expect(sort.execute([])).toEqual([]);
      });

      it('should handle sort of single element', () => {
        const sort = SortMuscle.ascending();
        expect(sort.execute([42])).toEqual([42]);
      });

      it('should handle sort of already sorted array', () => {
        const sort = SortMuscle.ascending();
        expect(sort.execute([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
      });

      it('should handle sort with equal elements', () => {
        const sort = SortMuscle.ascending();
        expect(sort.execute([3, 1, 3, 2, 1])).toEqual([1, 1, 2, 3, 3]);
      });
    });

    describe('MapMuscle', () => {
      it('should handle map on empty array', () => {
        const double = MapMuscle.create((...args: unknown[]) => {
          const x = args[0] as number;
          return x * 2;
        });
        expect(double.execute([])).toEqual([]);
      });

      it('should handle property extraction with missing property', () => {
        const getProp = MapMuscle.property<Record<string, unknown>>('nonexistent');
        const result = getProp.execute([{ a: 1 }, { b: 2 }]);
        expect(result).toEqual([undefined, undefined]);
      });
    });

    describe('ReduceMuscle', () => {
      it('should handle reduce on empty array', () => {
        const sum = ReduceMuscle.create((...args: unknown[]) => {
          const acc = args[0] as number;
          const val = args[1] as number;
          return acc + val;
        }, 0);
        expect(sum.execute([])).toBe(0);
      });

      it('should handle groupBy with empty array', () => {
        const group = ReduceMuscle.groupBy<{ type: string }>('type');
        expect(group.execute([])).toEqual({});
      });

      it('should handle groupBy with single group', () => {
        const group = ReduceMuscle.groupBy<{ type: string; value: number }>('type');
        const result = group.execute([
          { type: 'A', value: 1 },
          { type: 'A', value: 2 },
        ]);
        expect(result).toEqual({
          A: [
            { type: 'A', value: 1 },
            { type: 'A', value: 2 },
          ],
        });
      });
    });
  });
});
