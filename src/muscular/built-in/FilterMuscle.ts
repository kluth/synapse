import { Muscle } from '../core/Muscle';

/**
 * FilterMuscle - Data filtering operations
 */
export class FilterMuscle {
  static create<T>(predicate: (item: T) => boolean): Muscle<T[], T[]> {
    return new Muscle(
      'filter',
      (...args: unknown[]) => {
        const arr = args[0] as T[];
        return arr.filter(predicate);
      },
      { deterministic: true },
    );
  }

  static greaterThan(value: number): Muscle<number[], number[]> {
    return FilterMuscle.create<number>((x) => x > value);
  }

  static lessThan(value: number): Muscle<number[], number[]> {
    return FilterMuscle.create<number>((x) => x < value);
  }

  static equalTo<T>(value: T): Muscle<T[], T[]> {
    return FilterMuscle.create<T>((x) => x === value);
  }

  static truthy<T>(): Muscle<T[], T[]> {
    return FilterMuscle.create<T>((x) => Boolean(x));
  }

  static unique<T>(): Muscle<T[], T[]> {
    return new Muscle(
      'unique',
      (...args: unknown[]) => {
        const arr = args[0] as T[];
        return Array.from(new Set(arr));
      },
      { deterministic: true },
    );
  }
}
