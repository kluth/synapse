import { Muscle } from '../core/Muscle';

/**
 * AggregateMuscle - Data aggregation operations
 */
export class AggregateMuscle {
  static sum(): Muscle<number[], number> {
    return new Muscle('sum', (arr: number[]) => arr.reduce((a, b) => a + b, 0), { deterministic: true });
  }

  static average(): Muscle<number[], number> {
    return new Muscle('average', (arr: number[]) => {
      if (arr.length === 0) return 0;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }, { deterministic: true });
  }

  static min(): Muscle<number[], number> {
    return new Muscle('min', (arr: number[]) => Math.min(...arr), { deterministic: true });
  }

  static max(): Muscle<number[], number> {
    return new Muscle('max', (arr: number[]) => Math.max(...arr), { deterministic: true });
  }

  static count(): Muscle<any[], number> {
    return new Muscle('count', (arr: any[]) => arr.length, { deterministic: true });
  }

  static first<T>(): Muscle<T[], T | undefined> {
    return new Muscle('first', (arr: T[]) => arr[0], { deterministic: true });
  }

  static last<T>(): Muscle<T[], T | undefined> {
    return new Muscle('last', (arr: T[]) => arr[arr.length - 1], { deterministic: true });
  }
}
