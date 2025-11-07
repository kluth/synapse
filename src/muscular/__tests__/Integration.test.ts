import { Muscle } from '../core/Muscle';
import { MuscleGroup } from '../core/MuscleGroup';
import { MuscleMemory } from '../core/MuscleMemory';
import { ComputeMuscle, TransformMuscle, AggregateMuscle, FilterMuscle, MapMuscle } from '../built-in';
import { Bone } from '../../skeletal/core/Bone';
import { Schema } from '../../skeletal/core/Schema';
import { FieldSchema } from '../../skeletal/core/FieldSchema';

describe('Muscular System Integration Tests', () => {
  describe('Complex Pipelines', () => {
    it('should create ETL pipeline for data processing', async () => {
      // Extract - parse JSON
      const extract = TransformMuscle.parseJSON<{ users: Array<{ name: string; age: number; active: boolean }> }>();

      // Transform - filter active users, extract names, convert to uppercase
      const filterActive = FilterMuscle.create((u: { name: string; age: number; active: boolean }) => u.active);
      const extractNames = MapMuscle.property<{ name: string; age: number; active: boolean }>('name');
      const toUpper = MapMuscle.create((name: string) => name.toUpperCase());

      // Load - join into comma-separated string
      const load = TransformMuscle.join(', ');

      const pipeline = MuscleGroup.sequential([
        extract,
        new Muscle('getUsers', (data: any) => data.users),
        filterActive,
        extractNames,
        toUpper,
        load,
      ]);

      const json = JSON.stringify({
        users: [
          { name: 'Alice', age: 30, active: true },
          { name: 'Bob', age: 25, active: false },
          { name: 'Charlie', age: 35, active: true },
        ],
      });

      const result = await pipeline.execute(json);
      expect(result).toBe('ALICE, CHARLIE');
    });

    it('should process numerical data through multiple transformations', async () => {
      const pipeline = MuscleGroup.sequential([
        FilterMuscle.greaterThan(0), // Remove negatives
        MapMuscle.create((x: number) => x * 2), // Double
        FilterMuscle.create((x: number) => x % 2 === 0), // Keep even
        new Muscle('sort', (arr: number[]) => [...arr].sort((a, b) => a - b)), // Sort
        AggregateMuscle.sum(), // Sum
      ]);

      const result = await pipeline.execute([5, -3, 2, -1, 8, 0, 3]);
      // Filter > 0: [5, 2, 8, 3]
      // Double: [10, 4, 16, 6]
      // Keep even: [10, 4, 16, 6]
      // Sort: [4, 6, 10, 16]
      // Sum: 36
      expect(result).toBe(36);
    });
  });

  describe('Memoization with Real-World Scenarios', () => {
    it('should cache expensive computations', () => {
      let callCount = 0;
      const expensiveComputation = new Muscle(
        'fibonacci',
        (n: number): number => {
          callCount++;
          if (n <= 1) return n;
          // Simplified version - in reality this would recurse
          return n * 2; // Placeholder
        },
        { deterministic: true }
      );

      expensiveComputation.execute(10);
      expensiveComputation.execute(10);
      expensiveComputation.execute(10);

      expect(callCount).toBe(1); // Only called once due to memoization
    });

    it('should not cache when deterministic is false', () => {
      let callCount = 0;
      const nonDeterministic = new Muscle(
        'random',
        () => {
          callCount++;
          return Math.random();
        },
        { deterministic: false }
      );

      nonDeterministic.execute();
      nonDeterministic.execute();
      nonDeterministic.execute();

      expect(callCount).toBe(3); // Called every time
    });
  });

  describe('Schema Validation in Real Scenarios', () => {
    it('should validate user registration data', () => {
      const userSchema = new Bone(
        'User',
        new Schema({
          email: new FieldSchema('string'),
          age: new FieldSchema('number'),
          name: new FieldSchema('string'),
        })
      );

      const registerUser = new Muscle(
        'registerUser',
        (data: { email: string; age: number; name: string }) => {
          return { ...data, id: Date.now(), createdAt: new Date() };
        },
        { inputSchema: userSchema }
      );

      const validUser = { email: 'test@example.com', age: 25, name: 'John' };
      const result = registerUser.execute(validUser);

      expect(result.email).toBe('test@example.com');
      expect(result.id).toBeDefined();
    });

    it('should reject invalid user data', () => {
      const userSchema = new Bone(
        'User',
        new Schema({
          email: new FieldSchema('string'),
          age: new FieldSchema('number'),
        })
      );

      const registerUser = new Muscle(
        'registerUser',
        (data: any) => data,
        { inputSchema: userSchema }
      );

      expect(() => registerUser.execute({ email: 'test@example.com', age: 'invalid' })).toThrow();
    });
  });

  describe('Error Handling and Retry', () => {
    it('should retry failed API calls', async () => {
      let attempts = 0;
      const flakeyAPI = new Muscle(
        'fetchData',
        async () => {
          attempts++;
          if (attempts < 3) throw new Error('Network error');
          return { data: 'success' };
        },
        {
          retry: {
            maxAttempts: 3,
            delay: 10,
          },
        }
      );

      const result = await flakeyAPI.executeAsync();
      expect(result).toEqual({ data: 'success' });
      expect(attempts).toBe(3);
    });

    it('should handle errors in pipeline gracefully', async () => {
      const step1 = new Muscle('step1', (x: number) => x + 1);
      const failingStep = new Muscle('failing', () => {
        throw new Error('Something went wrong');
      });
      const step3 = new Muscle('step3', (x: number) => x * 2);

      const pipeline = MuscleGroup.sequential([step1, failingStep, step3]);

      await expect(pipeline.execute(5)).rejects.toThrow('Something went wrong');
    });
  });

  describe('Parallel Execution Performance', () => {
    it('should execute independent tasks in parallel', async () => {
      const startTime = Date.now();

      const task1 = new Muscle('task1', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result1';
      });

      const task2 = new Muscle('task2', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result2';
      });

      const task3 = new Muscle('task3', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result3';
      });

      const parallel = MuscleGroup.parallel([task1, task2, task3]);
      const results = await parallel.execute();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toEqual(['result1', 'result2', 'result3']);
      // Should take ~100ms (parallel) not ~300ms (sequential)
      expect(duration).toBeLessThan(200);
    }, 10000);
  });

  describe('Conditional Logic', () => {
    it('should route processing based on data type', async () => {
      const processNumber = new Muscle('processNumber', (x: number) => x * 2);
      const processString = new Muscle('processString', (x: string) => x.toUpperCase());

      const conditional = MuscleGroup.switch([
        {
          condition: (x: any) => typeof x === 'number',
          muscle: processNumber,
        },
        {
          condition: (x: any) => typeof x === 'string',
          muscle: processString,
        },
      ]);

      expect(await conditional.execute(5)).toBe(10);
      expect(await conditional.execute('hello')).toBe('HELLO');
    });
  });

  describe('Transaction and Saga Patterns', () => {
    it('should rollback on failure', async () => {
      const state = { balance: 100 };

      const debit = new Muscle(
        'debit',
        async (amount: number) => {
          state.balance -= amount;
          return state.balance;
        },
        {
          metadata: {
            rollback: () => {
              state.balance += 50; // Restore
            },
          },
        }
      );

      const failing = new Muscle('failing', async () => {
        throw new Error('Transaction failed');
      });

      const transaction = MuscleGroup.transaction([debit, failing]);

      await expect(transaction.execute(50)).rejects.toThrow('Transaction failed');
      expect(state.balance).toBe(100); // Rolled back
    });
  });

  describe('Caching Integration', () => {
    it('should use MuscleMemory with Muscle execution', async () => {
      const cache = new MuscleMemory<number>();
      let callCount = 0;

      const expensiveCalc = new Muscle('calc', (x: number) => {
        callCount++;
        return x * x;
      });

      const getCached = async (x: number) => {
        return cache.getOrLoad(`calc:${x}`, async () => {
          return expensiveCalc.execute(x);
        });
      };

      await getCached(5);
      await getCached(5);
      await getCached(5);

      expect(callCount).toBe(1); // Only called once, rest from cache
    });
  });

  describe('Complex Data Transformations', () => {
    it('should process e-commerce order data', async () => {
      interface Order {
        items: Array<{ price: number; quantity: number }>;
        discount: number;
      }

      const calculateTotal = new Muscle('calculateTotal', (order: Order) => {
        const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return subtotal * (1 - order.discount);
      });

      const order: Order = {
        items: [
          { price: 10, quantity: 2 },
          { price: 20, quantity: 1 },
        ],
        discount: 0.1,
      };

      // (10*2 + 20*1) * (1 - 0.1) = 40 * 0.9 = 36
      expect(calculateTotal.execute(order)).toBe(36);
    });
  });

  describe('Built-in Muscles Composition', () => {
    it('should compose multiple built-in muscles', () => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      // Get even numbers, square them, sum
      const filterEven = FilterMuscle.create((x: number) => x % 2 === 0);
      const square = MapMuscle.create((x: number) => x * x);
      const sum = AggregateMuscle.sum();

      const result1 = filterEven.execute(numbers); // [2, 4, 6, 8, 10]
      const result2 = square.execute(result1); // [4, 16, 36, 64, 100]
      const result3 = sum.execute(result2); // 220

      expect(result3).toBe(220);
    });
  });
});
