import { Muscle } from '../core/Muscle';

/**
 * MapMuscle - Collection mapping operations
 */
export class MapMuscle {
  static create<T, U>(mapper: (item: T) => U): Muscle<T[], U[]> {
    return new Muscle('map', (arr: T[]) => arr.map(mapper), { deterministic: true });
  }

  static property<T>(property: keyof T): Muscle<T[], any[]> {
    return MapMuscle.create<T, any>((item) => item[property]);
  }

  static withIndex<T, U>(mapper: (item: T, index: number) => U): Muscle<T[], U[]> {
    return new Muscle('mapWithIndex', (arr: T[]) => arr.map(mapper), { deterministic: true });
  }
}
