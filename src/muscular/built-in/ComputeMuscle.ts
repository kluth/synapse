import { Muscle } from '../core/Muscle';

/**
 * ComputeMuscle - Mathematical operations
 */
export class ComputeMuscle {
  static add(): Muscle<[number, number], number> {
    return new Muscle(
      'add',
      (...args: unknown[]) => {
        const a = args[0] as number;
        const b = args[1] as number;
        return a + b;
      },
      { deterministic: true },
    );
  }

  static subtract(): Muscle<[number, number], number> {
    return new Muscle(
      'subtract',
      (...args: unknown[]) => {
        const a = args[0] as number;
        const b = args[1] as number;
        return a - b;
      },
      { deterministic: true },
    );
  }

  static multiply(): Muscle<[number, number], number> {
    return new Muscle(
      'multiply',
      (...args: unknown[]) => {
        const a = args[0] as number;
        const b = args[1] as number;
        return a * b;
      },
      { deterministic: true },
    );
  }

  static divide(): Muscle<[number, number], number> {
    return new Muscle(
      'divide',
      (...args: unknown[]) => {
        const a = args[0] as number;
        const b = args[1] as number;
        return a / b;
      },
      { deterministic: true },
    );
  }

  static power(): Muscle<[number, number], number> {
    return new Muscle(
      'power',
      (...args: unknown[]) => {
        const a = args[0] as number;
        const b = args[1] as number;
        return Math.pow(a, b);
      },
      { deterministic: true },
    );
  }

  static modulo(): Muscle<[number, number], number> {
    return new Muscle(
      'modulo',
      (...args: unknown[]) => {
        const a = args[0] as number;
        const b = args[1] as number;
        return a % b;
      },
      { deterministic: true },
    );
  }

  static abs(): Muscle<number, number> {
    return new Muscle(
      'abs',
      (...args: unknown[]) => {
        const x = args[0] as number;
        return Math.abs(x);
      },
      { deterministic: true },
    );
  }

  static sqrt(): Muscle<number, number> {
    return new Muscle(
      'sqrt',
      (...args: unknown[]) => {
        const x = args[0] as number;
        return Math.sqrt(x);
      },
      { deterministic: true },
    );
  }

  static round(): Muscle<number, number> {
    return new Muscle(
      'round',
      (...args: unknown[]) => {
        const x = args[0] as number;
        return Math.round(x);
      },
      { deterministic: true },
    );
  }

  static floor(): Muscle<number, number> {
    return new Muscle(
      'floor',
      (...args: unknown[]) => {
        const x = args[0] as number;
        return Math.floor(x);
      },
      { deterministic: true },
    );
  }

  static ceil(): Muscle<number, number> {
    return new Muscle(
      'ceil',
      (...args: unknown[]) => {
        const x = args[0] as number;
        return Math.ceil(x);
      },
      { deterministic: true },
    );
  }
}
