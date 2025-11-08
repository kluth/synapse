/* eslint-disable @typescript-eslint/no-extraneous-class */
import { Muscle } from '../core/Muscle';

/**
 * ComputeMuscle - Mathematical operations
 */
export class ComputeMuscle {
  static add(): Muscle<[number, number], number> {
    return new Muscle('add', (a: number, b: number) => a + b, { deterministic: true });
  }

  static subtract(): Muscle<[number, number], number> {
    return new Muscle('subtract', (a: number, b: number) => a - b, { deterministic: true });
  }

  static multiply(): Muscle<[number, number], number> {
    return new Muscle('multiply', (a: number, b: number) => a * b, { deterministic: true });
  }

  static divide(): Muscle<[number, number], number> {
    return new Muscle('divide', (a: number, b: number) => a / b, { deterministic: true });
  }

  static power(): Muscle<[number, number], number> {
    return new Muscle('power', (a: number, b: number) => Math.pow(a, b), { deterministic: true });
  }

  static modulo(): Muscle<[number, number], number> {
    return new Muscle('modulo', (a: number, b: number) => a % b, { deterministic: true });
  }

  static abs(): Muscle<number, number> {
    return new Muscle('abs', (x: number) => Math.abs(x), { deterministic: true });
  }

  static sqrt(): Muscle<number, number> {
    return new Muscle('sqrt', (x: number) => Math.sqrt(x), { deterministic: true });
  }

  static round(): Muscle<number, number> {
    return new Muscle('round', (x: number) => Math.round(x), { deterministic: true });
  }

  static floor(): Muscle<number, number> {
    return new Muscle('floor', (x: number) => Math.floor(x), { deterministic: true });
  }

  static ceil(): Muscle<number, number> {
    return new Muscle('ceil', (x: number) => Math.ceil(x), { deterministic: true });
  }
}
