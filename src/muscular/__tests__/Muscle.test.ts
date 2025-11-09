import { Muscle } from '../core/Muscle';
import { Bone } from '../../skeletal/core/Bone';
import { Schema } from '../../skeletal/core/Schema';
import { FieldSchema } from '../../skeletal/core/FieldSchema';

describe('Muscle', () => {
  describe('Basic Functionality', () => {
    it('should create a muscle with a pure function', () => {
      const addOne = (...args: unknown[]) => {
        const x = args[0] as number;
        return x + 1;
      };
      const muscle = new Muscle('addOne', addOne);

      expect(muscle.name).toBe('addOne');
      expect(muscle.execute(5)).toBe(6);
    });

    it('should execute the wrapped function', () => {
      const multiply = (...args: unknown[]) => {
        const a = args[0] as number;
        const b = args[1] as number;
        return a * b;
      };
      const muscle = new Muscle('multiply', multiply);

      expect(muscle.execute(3, 4)).toBe(12);
    });

    it('should store metadata', () => {
      const fn = (...args: unknown[]) => {
        const x = args[0] as number;
        return x * 2;
      };
      const muscle = new Muscle('double', fn, {
        metadata: {
          description: 'Doubles a number',
          version: '1.0.0',
        },
      });

      expect(muscle.metadata.description).toBe('Doubles a number');
      expect(muscle.metadata.version).toBe('1.0.0');
    });
  });

  describe('Schema Validation', () => {
    it('should validate input using Bone schema', () => {
      const inputSchema = new Bone(
        'InputParams',
        new Schema({
          x: new FieldSchema('number'),
        }),
      );

      const addOne = (...args: unknown[]) => {
        const params = args[0] as { x: number };
        return params.x + 1;
      };
      const muscle = new Muscle('addOne', addOne, {
        inputSchema,
      });

      expect(muscle.execute({ x: 5 })).toBe(6);
    });

    it('should throw validation error for invalid input', () => {
      const inputSchema = new Bone(
        'InputParams',
        new Schema({
          x: new FieldSchema('number'),
        }),
      );

      const addOne = (...args: unknown[]) => {
        const params = args[0] as { x: number };
        return params.x + 1;
      };
      const muscle = new Muscle('addOne', addOne, {
        inputSchema,
      });

      expect(() => muscle.execute({ x: 'invalid' })).toThrow();
    });

    it('should validate output using Bone schema', () => {
      const outputSchema = new Bone(
        'OutputResult',
        new Schema({
          result: new FieldSchema('number'),
        }),
      );

      const compute = () => ({ result: 42 });
      const muscle = new Muscle('compute', compute, {
        outputSchema,
      });

      expect(muscle.execute()).toEqual({ result: 42 });
    });

    it('should throw validation error for invalid output', () => {
      const outputSchema = new Bone(
        'OutputResult',
        new Schema({
          result: new FieldSchema('number'),
        }),
      );

      const compute = () => ({ result: 'invalid' });
      const muscle = new Muscle('compute', compute, {
        outputSchema,
      });

      expect(() => muscle.execute()).toThrow();
    });
  });

  describe('Memoization', () => {
    it('should memoize deterministic functions', () => {
      const fn = jest.fn((...args: unknown[]) => {
        const x = args[0] as number;
        return x * 2;
      });
      const muscle = new Muscle('double', fn, {
        deterministic: true,
      });

      expect(muscle.execute(5)).toBe(10);
      expect(muscle.execute(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1); // Should be called only once
    });

    it('should not memoize non-deterministic functions', () => {
      const fn = jest.fn(() => Math.random());
      const muscle = new Muscle('random', fn, {
        deterministic: false,
      });

      muscle.execute();
      muscle.execute();
      expect(fn).toHaveBeenCalledTimes(2); // Should be called twice
    });

    it('should cache based on input parameters', () => {
      const fn = jest.fn((...args: unknown[]) => {
        const x = args[0] as number;
        return x * 2;
      });
      const muscle = new Muscle('double', fn, {
        deterministic: true,
      });

      expect(muscle.execute(5)).toBe(10);
      expect(muscle.execute(10)).toBe(20);
      expect(muscle.execute(5)).toBe(10);
      expect(fn).toHaveBeenCalledTimes(2); // Called for 5 and 10, not for second 5
    });
  });

  describe('Error Handling', () => {
    it('should catch and wrap errors', () => {
      const failingFn = () => {
        throw new Error('Operation failed');
      };
      const muscle = new Muscle('failing', failingFn);

      expect(() => muscle.execute()).toThrow('Operation failed');
    });

    it('should retry on failure when retry policy is set', async () => {
      let attempts = 0;
      const flakeyFn = () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const muscle = new Muscle('flakey', flakeyFn, {
        retry: {
          maxAttempts: 3,
          delay: 10,
        },
      });

      const result = await muscle.executeAsync();
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retry attempts', async () => {
      const alwaysFailsFn = () => {
        throw new Error('Permanent failure');
      };

      const muscle = new Muscle('alwaysFails', alwaysFailsFn, {
        retry: {
          maxAttempts: 2,
          delay: 10,
        },
      });

      await expect(muscle.executeAsync()).rejects.toThrow('Permanent failure');
    });
  });

  describe('Execution Context', () => {
    it('should accept execution context', () => {
      const fn = (...args: unknown[]) => {
        const x = args[0] as number;
        const context = args[1] as { offset?: number } | undefined;
        return x + (context?.offset || 0);
      };
      const muscle = new Muscle('add', fn);

      expect(muscle.execute(5, { offset: 10 })).toBe(15);
    });

    it('should support dependency injection through context', () => {
      interface Context {
        logger?: { log: (msg: string) => void };
      }

      const fn = (...args: unknown[]) => {
        const x = args[0] as number;
        const context = args[1] as Context | undefined;
        context?.logger?.log(`Processing ${x}`);
        return x * 2;
      };

      const logger = { log: jest.fn() };
      const muscle = new Muscle('double', fn);

      muscle.execute(5, { logger });
      expect(logger.log).toHaveBeenCalledWith('Processing 5');
    });
  });

  describe('Cancellation Support', () => {
    it('should support cancellation via AbortSignal', async () => {
      const longRunningFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return 'completed';
      };

      const muscle = new Muscle('longRunning', longRunningFn);
      const controller = new AbortController();

      const promise = muscle.executeAsync(undefined, { signal: controller.signal });
      controller.abort();

      await expect(promise).rejects.toThrow();
    });
  });
});
