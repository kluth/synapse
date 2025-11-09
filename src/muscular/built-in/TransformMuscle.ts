import { Muscle } from '../core/Muscle';

/**
 * TransformMuscle - Data transformations
 */
export class TransformMuscle {
  static toString(): Muscle<unknown, string> {
    return new Muscle(
      'toString',
      (...args: unknown[]) => {
        const x = args[0];
        return String(x);
      },
      { deterministic: true },
    );
  }

  static toNumber(): Muscle<unknown, number> {
    return new Muscle(
      'toNumber',
      (...args: unknown[]) => {
        const x = args[0];
        return Number(x);
      },
      { deterministic: true },
    );
  }

  static toBoolean(): Muscle<unknown, boolean> {
    return new Muscle(
      'toBoolean',
      (...args: unknown[]) => {
        const x = args[0];
        return Boolean(x);
      },
      { deterministic: true },
    );
  }

  static toUpperCase(): Muscle<string, string> {
    return new Muscle(
      'toUpperCase',
      (...args: unknown[]) => {
        const x = args[0] as string;
        return x.toUpperCase();
      },
      { deterministic: true },
    );
  }

  static toLowerCase(): Muscle<string, string> {
    return new Muscle(
      'toLowerCase',
      (...args: unknown[]) => {
        const x = args[0] as string;
        return x.toLowerCase();
      },
      { deterministic: true },
    );
  }

  static trim(): Muscle<string, string> {
    return new Muscle(
      'trim',
      (...args: unknown[]) => {
        const x = args[0] as string;
        return x.trim();
      },
      { deterministic: true },
    );
  }

  static parseJSON<T = unknown>(): Muscle<string, T> {
    return new Muscle(
      'parseJSON',
      (...args: unknown[]) => {
        const x = args[0] as string;
        return JSON.parse(x) as T;
      },
      { deterministic: true },
    );
  }

  static stringifyJSON(): Muscle<unknown, string> {
    return new Muscle(
      'stringifyJSON',
      (...args: unknown[]) => {
        const x = args[0];
        return JSON.stringify(x);
      },
      { deterministic: true },
    );
  }

  static split(separator: string): Muscle<string, string[]> {
    return new Muscle(
      'split',
      (...args: unknown[]) => {
        const x = args[0] as string;
        return x.split(separator);
      },
      { deterministic: true },
    );
  }

  static join(separator: string): Muscle<string[], string> {
    return new Muscle(
      'join',
      (...args: unknown[]) => {
        const x = args[0] as string[];
        return x.join(separator);
      },
      { deterministic: true },
    );
  }
}
