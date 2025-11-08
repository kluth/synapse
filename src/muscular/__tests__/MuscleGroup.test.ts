import { MuscleGroup } from '../core/MuscleGroup';
import { Muscle } from '../core/Muscle';

describe('MuscleGroup', () => {
  describe('Sequential Execution (Pipeline)', () => {
    it('should execute muscles sequentially', async () => {
      const addOne = new Muscle('addOne', (x: number) => x + 1);
      const double = new Muscle('double', (x: number) => x * 2);
      const subtract5 = new Muscle('subtract5', (x: number) => x - 5);

      const pipeline = MuscleGroup.sequential([addOne, double, subtract5]);

      // (5 + 1) * 2 - 5 = 7
      const result = await pipeline.execute(5);
      expect(result).toBe(7);
    });

    it('should pass output of one muscle to next', async () => {
      const toString = new Muscle('toString', (x: number) => String(x));
      const addExclamation = new Muscle('addExclamation', (x: string) => x + '!');

      const pipeline = MuscleGroup.sequential([toString, addExclamation]);

      const result = await pipeline.execute(42);
      expect(result).toBe('42!');
    });

    it('should handle empty muscle group', async () => {
      const pipeline = MuscleGroup.sequential([]);

      const result = await pipeline.execute(10);
      expect(result).toBe(10);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute muscles in parallel', async () => {
      const executionOrder: number[] = [];

      const slow = new Muscle('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        executionOrder.push(1);
        return 'slow';
      });

      const fast = new Muscle('fast', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionOrder.push(2);
        return 'fast';
      });

      const parallel = MuscleGroup.parallel([slow, fast]);
      const result = await parallel.execute();

      // Fast should complete before slow
      expect(executionOrder).toEqual([2, 1]);
      expect(result).toEqual(['slow', 'fast']);
    });

    it('should collect all results', async () => {
      const double = new Muscle('double', (x: number) => x * 2);
      const triple = new Muscle('triple', (x: number) => x * 3);
      const quadruple = new Muscle('quadruple', (x: number) => x * 4);

      const parallel = MuscleGroup.parallel([double, triple, quadruple]);
      const result = await parallel.execute(5);

      expect(result).toEqual([10, 15, 20]);
    });

    it('should fail fast if any muscle fails', async () => {
      const success1 = new Muscle('success1', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'success1';
      });

      const failing = new Muscle('failing', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Failed!');
      });

      const success2 = new Muscle('success2', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'success2';
      });

      const parallel = MuscleGroup.parallel([success1, failing, success2]);

      await expect(parallel.execute()).rejects.toThrow('Failed!');
    });
  });

  describe('Conditional Execution (Branching)', () => {
    it('should execute muscle based on condition', async () => {
      const double = new Muscle('double', (x: number) => x * 2);
      const triple = new Muscle('triple', (x: number) => x * 3);

      const conditional = MuscleGroup.conditional((x: number) => x > 10, double, triple);

      expect(await conditional.execute(15)).toBe(30); // 15 * 2
      expect(await conditional.execute(5)).toBe(15); // 5 * 3
    });

    it('should support multiple branches', async () => {
      const small = new Muscle('small', (x: number) => `small: ${x}`);
      const medium = new Muscle('medium', (x: number) => `medium: ${x}`);
      const large = new Muscle('large', (x: number) => `large: ${x}`);

      const conditional = MuscleGroup.switch<number, string>([
        { condition: (x) => x < 10, muscle: small },
        { condition: (x) => x < 100, muscle: medium },
        { condition: () => true, muscle: large },
      ]);

      expect(await conditional.execute(5)).toBe('small: 5');
      expect(await conditional.execute(50)).toBe('medium: 50');
      expect(await conditional.execute(500)).toBe('large: 500');
    });
  });

  describe('Transaction Support (All-or-Nothing)', () => {
    it('should commit all changes on success', async () => {
      const state = { count: 0, values: [] as number[] };

      const increment = new Muscle('increment', async () => {
        state.count++;
        return state.count;
      });

      const addValue = new Muscle('addValue', async (val: number) => {
        state.values.push(val);
        return val;
      });

      const transaction = MuscleGroup.transaction([
        increment,
        new Muscle('add10', () => addValue.execute(10)),
        new Muscle('add20', () => addValue.execute(20)),
      ]);

      await transaction.execute();

      expect(state.count).toBe(1);
      expect(state.values).toEqual([10, 20]);
    });

    it('should rollback all changes on failure', async () => {
      const state = { count: 0, values: [] as number[] };
      const originalState = { ...state };

      const increment = new Muscle(
        'increment',
        async () => {
          state.count++;
          return state.count;
        },
        {
          metadata: {
            rollback: () => {
              state.count--;
            },
          },
        },
      );

      const addValue = new Muscle(
        'addValue',
        async (val: number) => {
          state.values.push(val);
          return val;
        },
        {
          metadata: {
            rollback: () => {
              state.values.pop();
            },
          },
        },
      );

      const failing = new Muscle('failing', async () => {
        throw new Error('Transaction failed');
      });

      const transaction = MuscleGroup.transaction([
        increment,
        new Muscle('add10', () => addValue.execute(10)),
        failing,
      ]);

      await expect(transaction.execute()).rejects.toThrow('Transaction failed');

      // State should be rolled back
      expect(state.count).toBe(originalState.count);
      expect(state.values).toEqual(originalState.values);
    });
  });

  describe('Compensation Patterns (Saga)', () => {
    it('should execute compensation functions on failure', async () => {
      const executed: string[] = [];
      const compensated: string[] = [];

      const step1 = new Muscle(
        'step1',
        async () => {
          executed.push('step1');
          return 'result1';
        },
        {
          metadata: {
            compensate: async () => {
              compensated.push('step1');
            },
          },
        },
      );

      const step2 = new Muscle(
        'step2',
        async () => {
          executed.push('step2');
          return 'result2';
        },
        {
          metadata: {
            compensate: async () => {
              compensated.push('step2');
            },
          },
        },
      );

      const step3 = new Muscle(
        'step3',
        async () => {
          executed.push('step3');
          throw new Error('Step 3 failed');
        },
        {
          metadata: {
            compensate: async () => {
              compensated.push('step3');
            },
          },
        },
      );

      const saga = MuscleGroup.saga([step1, step2, step3]);

      await expect(saga.execute()).rejects.toThrow('Step 3 failed');

      expect(executed).toEqual(['step1', 'step2', 'step3']);
      // Compensations should run in reverse order
      expect(compensated).toEqual(['step2', 'step1']);
    });
  });

  describe('Composition', () => {
    it('should compose muscle groups together', async () => {
      const addOne = new Muscle('addOne', (x: number) => x + 1);
      const double = new Muscle('double', (x: number) => x * 2);
      const subtract5 = new Muscle('subtract5', (x: number) => x - 5);

      const firstPipeline = MuscleGroup.sequential([addOne, double]);
      const secondPipeline = MuscleGroup.sequential([firstPipeline, subtract5]);

      // (5 + 1) * 2 - 5 = 7
      const result = await secondPipeline.execute(5);
      expect(result).toBe(7);
    });
  });
});
