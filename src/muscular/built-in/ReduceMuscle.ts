import { Muscle } from '../core/Muscle';

/**
 * ReduceMuscle - Collection reduction operations
 */
export class ReduceMuscle {
  static create<T, U>(reducer: (acc: U, item: T) => U, initialValue: U): Muscle<T[], U> {
    return new Muscle('reduce', (arr: T[]) => arr.reduce(reducer, initialValue), { deterministic: true });
  }

  static groupBy<T>(property: keyof T): Muscle<T[], Record<string, T[]>> {
    return new Muscle('groupBy', (arr: T[]) => {
      return arr.reduce((acc, item) => {
        const key = String(item[property]);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {} as Record<string, T[]>);
    }, { deterministic: true });
  }
}
