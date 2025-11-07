import { Muscle } from '../core/Muscle';

/**
 * TransformMuscle - Data transformations
 */
export class TransformMuscle {
  static toString(): Muscle<any, string> {
    return new Muscle('toString', (x: any) => String(x), { deterministic: true });
  }

  static toNumber(): Muscle<any, number> {
    return new Muscle('toNumber', (x: any) => Number(x), { deterministic: true });
  }

  static toBoolean(): Muscle<any, boolean> {
    return new Muscle('toBoolean', (x: any) => Boolean(x), { deterministic: true });
  }

  static toUpperCase(): Muscle<string, string> {
    return new Muscle('toUpperCase', (x: string) => x.toUpperCase(), { deterministic: true });
  }

  static toLowerCase(): Muscle<string, string> {
    return new Muscle('toLowerCase', (x: string) => x.toLowerCase(), { deterministic: true });
  }

  static trim(): Muscle<string, string> {
    return new Muscle('trim', (x: string) => x.trim(), { deterministic: true });
  }

  static parseJSON<T = any>(): Muscle<string, T> {
    return new Muscle('parseJSON', (x: string) => JSON.parse(x), { deterministic: true });
  }

  static stringifyJSON(): Muscle<any, string> {
    return new Muscle('stringifyJSON', (x: any) => JSON.stringify(x), { deterministic: true });
  }

  static split(separator: string): Muscle<string, string[]> {
    return new Muscle('split', (x: string) => x.split(separator), { deterministic: true });
  }

  static join(separator: string): Muscle<string[], string> {
    return new Muscle('join', (x: string[]) => x.join(separator), { deterministic: true });
  }
}
