/* eslint-disable @typescript-eslint/no-extraneous-class */
import { Muscle } from '../core/Muscle';

/**
 * SortMuscle - Data sorting operations
 */
export class SortMuscle {
  static ascending(): Muscle<number[], number[]> {
    return new Muscle('sortAscending', (arr: number[]) => [...arr].sort((a, b) => a - b), {
      deterministic: true,
    });
  }

  static descending(): Muscle<number[], number[]> {
    return new Muscle('sortDescending', (arr: number[]) => [...arr].sort((a, b) => b - a), {
      deterministic: true,
    });
  }

  static by<T>(comparator: (a: T, b: T) => number): Muscle<T[], T[]> {
    return new Muscle('sortBy', (arr: T[]) => [...arr].sort(comparator), { deterministic: true });
  }

  static byProperty<T>(property: keyof T): Muscle<T[], T[]> {
    return new Muscle(
      'sortByProperty',
      (arr: T[]) => {
        return [...arr].sort((a, b) => {
          const aVal = a[property];
          const bVal = b[property];
          if (aVal < bVal) return -1;
          if (aVal > bVal) return 1;
          return 0;
        });
      },
      { deterministic: true },
    );
  }
}
