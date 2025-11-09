import { Muscle } from '../core/Muscle';

/**
 * AggregateMuscle - Data aggregation operations
 */
export class AggregateMuscle {
  static sum(): Muscle<number[], number> {
    return new Muscle(
      'sum',
      (...args: unknown[]) => {
        const arr = args[0] as number[];
        return arr.reduce((a, b) => a + b, 0);
      },
      {
        deterministic: true,
      },
    );
  }

  static average(): Muscle<number[], number> {
    return new Muscle(
      'average',
      (...args: unknown[]) => {
        const arr = args[0] as number[];
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
      },
      { deterministic: true },
    );
  }

  static min(): Muscle<number[], number> {
    return new Muscle(
      'min',
      (...args: unknown[]) => {
        const arr = args[0] as number[];
        return Math.min(...arr);
      },
      { deterministic: true },
    );
  }

  static max(): Muscle<number[], number> {
    return new Muscle(
      'max',
      (...args: unknown[]) => {
        const arr = args[0] as number[];
        return Math.max(...arr);
      },
      { deterministic: true },
    );
  }

  static count(): Muscle<unknown[], number> {
    return new Muscle(
      'count',
      (...args: unknown[]) => {
        const arr = args[0] as unknown[];
        return arr.length;
      },
      { deterministic: true },
    );
  }

  static first<T>(): Muscle<T[], T | undefined> {
    return new Muscle(
      'first',
      (...args: unknown[]) => {
        const arr = args[0] as T[];
        return arr[0];
      },
      { deterministic: true },
    );
  }

  static last<T>(): Muscle<T[], T | undefined> {
    return new Muscle(
      'last',
      (...args: unknown[]) => {
        const arr = args[0] as T[];
        return arr[arr.length - 1];
      },
      { deterministic: true },
    );
  }
}
