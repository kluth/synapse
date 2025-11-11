/**
 * Tests for Adipocyte (UI State Management)
 * Stores and manages UI state, inspired by fat cells (adipocytes) storing energy.
 */

import { Adipocyte } from '../Adipocyte';
import { randomUUID } from 'crypto'; // Import directly from crypto

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

const mockRandomUUID = randomUUID as jest.Mock; // Use the directly imported randomUUID

describe('Adipocyte - UI State Management', () => {
  let adipocyte: Adipocyte;

  beforeEach(() => {
    mockRandomUUID.mockClear();
    adipocyte = new Adipocyte({
      id: 'ui-state-manager',
      maxHistorySize: 50,
      enableTimeTravel: true,
    });
  });

  afterEach(async () => {
    await adipocyte.deactivate();
  });

  describe('Initialization', () => {
    it('should create Adipocyte with correct properties', () => {
      expect(adipocyte.id).toBe('ui-state-manager');
      expect(adipocyte.getState()).toEqual({});
    });

    it('should initialize with empty state', () => {
      expect(adipocyte.getState()).toEqual({});
    });

    it('should activate successfully', async () => {
      await adipocyte.activate();
      expect(adipocyte.getStatus()).toBe('active');
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await adipocyte.activate();
    });

    it('should set state value', () => {
      adipocyte.setState('user.name', 'John Doe');
      expect(adipocyte.getState('user.name')).toBe('John Doe');
    });

    it('should get nested state value', () => {
      adipocyte.setState('app.theme.mode', 'dark');
      expect(adipocyte.getState('app.theme.mode')).toBe('dark');
    });

    it('should return undefined for non-existent path', () => {
      expect(adipocyte.getState('non.existent.path')).toBeUndefined();
    });

    it('should update existing state value', () => {
      adipocyte.setState('counter', 0);
      adipocyte.setState('counter', 1);
      expect(adipocyte.getState('counter')).toBe(1);
    });

    it('should handle complex objects', () => {
      const user = { id: 1, name: 'Alice', roles: ['admin', 'user'] };
      adipocyte.setState('user', user);
      expect(adipocyte.getState('user')).toEqual(user);
    });

    it('should delete state value', () => {
      adipocyte.setState('temp.data', 'value');
      adipocyte.deleteState('temp.data');
      expect(adipocyte.getState('temp.data')).toBeUndefined();
    });

    it('should reset entire state', () => {
      adipocyte.setState('a', 1);
      adipocyte.setState('b', 2);
      adipocyte.resetState();
      expect(adipocyte.getState()).toEqual({});
    });
  });

  describe('State Subscriptions', () => {
    beforeEach(async () => {
      await adipocyte.activate();
    });

    it('should subscribe to state changes', () => {
      const callback = jest.fn();
      adipocyte.subscribe('counter', callback);

      adipocyte.setState('counter', 1);
      expect(callback).toHaveBeenCalledWith(1, undefined);
    });

    it('should notify subscribers with old and new values', () => {
      adipocyte.setState('count', 5);
      const callback = jest.fn();
      adipocyte.subscribe('count', callback);

      adipocyte.setState('count', 10);
      expect(callback).toHaveBeenCalledWith(10, 5);
    });

    it('should support multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      adipocyte.subscribe('data', callback1);
      adipocyte.subscribe('data', callback2);

      adipocyte.setState('data', 'value');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should unsubscribe callback', () => {
      const callback = jest.fn();
      const unsubscribe = adipocyte.subscribe('counter', callback);

      adipocyte.setState('counter', 1);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      adipocyte.setState('counter', 2);
      expect(callback).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should subscribe to wildcard paths', () => {
      const callback = jest.fn();
      adipocyte.subscribe('user.*', callback);

      adipocyte.setState('user.name', 'Alice');
      adipocyte.setState('user.age', 30);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should not notify on unrelated path changes', () => {
      const callback = jest.fn();
      adipocyte.subscribe('user.name', callback);

      adipocyte.setState('user.age', 30);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Selectors (Derived State)', () => {
    beforeEach(async () => {
      await adipocyte.activate();
    });

    it('should register selector', () => {
      const selector = (state: Record<string, unknown>) =>
        (state['firstName'] as string) + ' ' + (state['lastName'] as string);
      adipocyte.registerSelector('fullName', selector);

      adipocyte.setState('firstName', 'John');
      adipocyte.setState('lastName', 'Doe');

      expect(adipocyte.select('fullName')).toBe('John Doe');
    });

    it('should memoize selector results', () => {
      const selectorFn = jest.fn(
        (state: Record<string, unknown>) => (state['a'] as number) + (state['b'] as number),
      );
      adipocyte.registerSelector('sum', selectorFn);

      adipocyte.setState('a', 5);
      adipocyte.setState('b', 10);

      // First call
      const result1 = adipocyte.select('sum');
      expect(selectorFn).toHaveBeenCalledTimes(1);

      // Second call - should use cached result
      const result2 = adipocyte.select('sum');
      expect(selectorFn).toHaveBeenCalledTimes(1); // Still 1
      expect(result1).toBe(result2);
    });

    it('should recompute selector when dependencies change', () => {
      const selectorFn = jest.fn(
        (state: Record<string, unknown>) => (state['items'] as unknown[] | undefined)?.length ?? 0,
      );
      adipocyte.registerSelector('itemCount', selectorFn);

      adipocyte.setState('items', [1, 2, 3]);
      expect(adipocyte.select('itemCount')).toBe(3);

      adipocyte.setState('items', [1, 2, 3, 4]);
      expect(adipocyte.select('itemCount')).toBe(4);
      expect(selectorFn).toHaveBeenCalledTimes(2);
    });

    it('should support selector dependencies', () => {
      adipocyte.registerSelector('total', (state: Record<string, unknown>) =>
        ((state['prices'] as number[] | undefined) ?? []).reduce(
          (sum: number, p: number) => sum + p,
          0,
        ),
      );

      adipocyte.registerSelector(
        'totalWithTax',
        (_state: Record<string, unknown>) => (adipocyte.select('total') as number) * 1.1,
      );

      adipocyte.setState('prices', [10, 20, 30]);
      expect(adipocyte.select('totalWithTax')).toBe(66); // 60 * 1.1
    });
  });

  describe('Time-Travel Debugging', () => {
    beforeEach(async () => {
      adipocyte = new Adipocyte({
        id: 'time-travel-test',
        maxHistorySize: 5,
        enableTimeTravel: true,
      });
      await adipocyte.activate();
    });

    it('should record state history', () => {
      adipocyte.setState('counter', 0);
      adipocyte.setState('counter', 1);
      adipocyte.setState('counter', 2);

      const history = adipocyte.getHistory();
      expect(history).toHaveLength(3);
    });

    it('should limit history size', () => {
      for (let i = 0; i < 10; i++) {
        adipocyte.setState('value', i);
      }

      const history = adipocyte.getHistory();
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should undo state change', () => {
      adipocyte.setState('value', 1);
      adipocyte.setState('value', 2);
      adipocyte.setState('value', 3);

      expect(adipocyte.getState('value')).toBe(3);

      adipocyte.undo();
      expect(adipocyte.getState('value')).toBe(2);
    });

    it('should redo state change', () => {
      adipocyte.setState('value', 1);
      adipocyte.setState('value', 2);

      adipocyte.undo();
      expect(adipocyte.getState('value')).toBe(1);

      adipocyte.redo();
      expect(adipocyte.getState('value')).toBe(2);
    });

    it('should not undo beyond history', () => {
      adipocyte.setState('value', 1);

      adipocyte.undo();
      adipocyte.undo(); // Try to undo again

      // Should still work without error
      expect(adipocyte.getState()).toBeDefined();
    });

    it('should clear redo stack on new state change', () => {
      adipocyte.setState('value', 1);
      adipocyte.setState('value', 2);
      adipocyte.undo();

      // New change should clear redo stack
      adipocyte.setState('value', 3);

      adipocyte.redo(); // Should not go to 2
      expect(adipocyte.getState('value')).toBe(3);
    });

    it('should support jumping to specific history index', () => {
      adipocyte.setState('value', 1);
      adipocyte.setState('value', 2);
      adipocyte.setState('value', 3);

      adipocyte.jumpToState(0);
      expect(adipocyte.getState('value')).toBe(1);
    });
  });

  describe('State Persistence', () => {
    beforeEach(async () => {
      await adipocyte.activate();
    });

    it('should export state snapshot', () => {
      adipocyte.setState('user.name', 'Alice');
      adipocyte.setState('user.age', 30);
      adipocyte.setState('theme', 'dark');

      const snapshot = adipocyte.exportSnapshot();
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('state');
      expect(snapshot.state).toEqual({
        user: { name: 'Alice', age: 30 },
        theme: 'dark',
      });
    });

    it('should import state snapshot', () => {
      const snapshot = {
        timestamp: Date.now(),
        state: {
          user: { name: 'Bob', role: 'admin' },
          settings: { notifications: true },
        },
      };

      adipocyte.importSnapshot(snapshot);

      expect(adipocyte.getState('user.name')).toBe('Bob');
      expect(adipocyte.getState('settings.notifications')).toBe(true);
    });

    it('should preserve state across deactivation when using snapshots', async () => {
      adipocyte.setState('preserved', 'data');
      const snapshot = adipocyte.exportSnapshot();

      await adipocyte.deactivate();

      const newAdipocyte = new Adipocyte({
        id: 'restored',
        maxHistorySize: 50,
        enableTimeTravel: false,
      });
      await newAdipocyte.activate();
      newAdipocyte.importSnapshot(snapshot);

      expect(newAdipocyte.getState('preserved')).toBe('data');

      await newAdipocyte.deactivate();
    });
  });

  describe('State Middleware', () => {
    beforeEach(async () => {
      await adipocyte.activate();
    });

    it('should apply middleware on state changes', () => {
      const middleware = jest.fn((_path: string, value: unknown, _prevValue: unknown) => {
        return value;
      });

      adipocyte.addMiddleware(middleware);
      adipocyte.setState('test', 'value');

      expect(middleware).toHaveBeenCalledWith('test', 'value', undefined);
    });

    it('should allow middleware to transform values', () => {
      const uppercaseMiddleware = (_path: string, value: unknown) => {
        if (typeof value === 'string') {
          return value.toUpperCase();
        }
        return value;
      };

      adipocyte.addMiddleware(uppercaseMiddleware);
      adipocyte.setState('name', 'alice');

      expect(adipocyte.getState('name')).toBe('ALICE');
    });

    it('should execute multiple middleware in order', () => {
      const order: string[] = [];

      adipocyte.addMiddleware((_path: string, value: unknown) => {
        order.push('first');
        return value;
      });

      adipocyte.addMiddleware((_path: string, value: unknown) => {
        order.push('second');
        return value;
      });

      adipocyte.setState('test', 1);
      expect(order).toEqual(['first', 'second']);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await adipocyte.activate();
    });

    it('should handle large state efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        adipocyte.setState(`items.${i}`, { id: i, value: `item-${i}` });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should complete in < 2s
    });

    it('should handle many subscribers efficiently', () => {
      for (let i = 0; i < 100; i++) {
        adipocyte.subscribe(`path.${i}`, () => {});
      }

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        adipocyte.setState(`path.${i}`, i);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await adipocyte.activate();
    });

    it('should handle invalid state paths gracefully', () => {
      expect(() => {
        adipocyte.setState('', 'value');
      }).not.toThrow();
    });

    it('should handle circular references in state', () => {
      const circular: { a: number; self?: unknown } = { a: 1 };
      circular.self = circular;

      expect(() => {
        adipocyte.setState('circular', circular);
      }).not.toThrow();
    });

    it('should use randomUUID for hashState when circular references exist', () => {
      const circular: { a: number; self?: unknown } = { a: 1 };
      circular.self = circular;

      adipocyte.setState('circular', circular);
      // Trigger hashState via selector memoization
      // We need a selector that accesses the 'circular' state
      adipocyte.registerSelector('circularState', (state) => state['circular']);
      adipocyte.select('circularState');

      expect(mockRandomUUID).toHaveBeenCalled();
    });

    it('should handle errors in selector functions', () => {
      adipocyte.registerSelector('error', () => {
        throw new Error('Selector error');
      });

      expect(() => {
        adipocyte.select('error');
      }).toThrow('Selector error');
    });

    it('should handle errors in middleware', () => {
      adipocyte.addMiddleware(() => {
        throw new Error('Middleware error');
      });

      expect(() => {
        adipocyte.setState('test', 'value');
      }).toThrow('Middleware error');
    });
  });
});
