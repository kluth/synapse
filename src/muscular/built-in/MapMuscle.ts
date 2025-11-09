import { Muscle } from '../core/Muscle';

/**
 * MapMuscle - Collection mapping operations
 */
export class MapMuscle {
  static create<T, U>(mapper: (item: T) => U): Muscle<T[], U[]> {
    return new Muscle(
      'map',
      (...args: unknown[]) => {
        const arr = args[0] as T[];
        return arr.map(mapper);
      },
      { deterministic: true },
    );
  }

  static property<T>(property: keyof T): Muscle<T[], T[keyof T][]> {
    return MapMuscle.create<T, T[keyof T]>((item) => item[property]);
  }

  static withIndex<T, U>(mapper: (item: T, index: number) => U): Muscle<T[], U[]> {
    return new Muscle(
      'mapWithIndex',
      (...args: unknown[]) => {
        const arr = args[0] as T[];
        return arr.map(mapper);
      },
      { deterministic: true },
    );
  }
}
