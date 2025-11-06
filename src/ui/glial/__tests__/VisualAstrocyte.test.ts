/**
 * Tests for VisualAstrocyte (UI State Management)
 * Neural-inspired state management with time-travel debugging
 */

import { VisualAstrocyte } from '../VisualAstrocyte';

describe('VisualAstrocyte - UI State Management', () => {
  let astrocyte: VisualAstrocyte;

  beforeEach(() => {
    astrocyte = new VisualAstrocyte({
      id: 'ui-state-manager',
      maxHistorySize: 50,
      enableTimeTravel: true,
    });
  });

  afterEach(async () => {
    await astrocyte.deactivate();
  });

  describe('Initialization', () => {
    it('should create VisualAstrocyte with correct properties', () => {
      expect(astrocyte.id).toBe('ui-state-manager');
      expect(astrocyte.getState()).toEqual({});
    });

    it('should initialize with empty state', () => {
      expect(astrocyte.getState()).toEqual({});
    });

    it('should activate successfully', async () => {
      await astrocyte.activate();
      expect(astrocyte.getStatus()).toBe('active');
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should set state value', () => {
      astrocyte.setState('user.name', 'John Doe');
      expect(astrocyte.getState('user.name')).toBe('John Doe');
    });

    it('should get nested state value', () => {
      astrocyte.setState('app.theme.mode', 'dark');
      expect(astrocyte.getState('app.theme.mode')).toBe('dark');
    });

    it('should return undefined for non-existent path', () => {
      expect(astrocyte.getState('non.existent.path')).toBeUndefined();
    });

    it('should update existing state value', () => {
      astrocyte.setState('counter', 0);
      astrocyte.setState('counter', 1);
      expect(astrocyte.getState('counter')).toBe(1);
    });

    it('should handle complex objects', () => {
      const user = { id: 1, name: 'Alice', roles: ['admin', 'user'] };
      astrocyte.setState('user', user);
      expect(astrocyte.getState('user')).toEqual(user);
    });

    it('should delete state value', () => {
      astrocyte.setState('temp.data', 'value');
      astrocyte.deleteState('temp.data');
      expect(astrocyte.getState('temp.data')).toBeUndefined();
    });

    it('should reset entire state', () => {
      astrocyte.setState('a', 1);
      astrocyte.setState('b', 2);
      astrocyte.resetState();
      expect(astrocyte.getState()).toEqual({});
    });
  });

  describe('State Subscriptions', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should subscribe to state changes', () => {
      const callback = jest.fn();
      astrocyte.subscribe('counter', callback);

      astrocyte.setState('counter', 1);
      expect(callback).toHaveBeenCalledWith(1, undefined);
    });

    it('should notify subscribers with old and new values', () => {
      astrocyte.setState('count', 5);
      const callback = jest.fn();
      astrocyte.subscribe('count', callback);

      astrocyte.setState('count', 10);
      expect(callback).toHaveBeenCalledWith(10, 5);
    });

    it('should support multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      astrocyte.subscribe('data', callback1);
      astrocyte.subscribe('data', callback2);

      astrocyte.setState('data', 'value');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should unsubscribe callback', () => {
      const callback = jest.fn();
      const unsubscribe = astrocyte.subscribe('counter', callback);

      astrocyte.setState('counter', 1);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      astrocyte.setState('counter', 2);
      expect(callback).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should subscribe to wildcard paths', () => {
      const callback = jest.fn();
      astrocyte.subscribe('user.*', callback);

      astrocyte.setState('user.name', 'Alice');
      astrocyte.setState('user.age', 30);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should not notify on unrelated path changes', () => {
      const callback = jest.fn();
      astrocyte.subscribe('user.name', callback);

      astrocyte.setState('user.age', 30);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Selectors (Derived State)', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should register selector', () => {
      const selector = (state: any) => state.firstName + ' ' + state.lastName;
      astrocyte.registerSelector('fullName', selector);

      astrocyte.setState('firstName', 'John');
      astrocyte.setState('lastName', 'Doe');

      expect(astrocyte.select('fullName')).toBe('John Doe');
    });

    it('should memoize selector results', () => {
      const selectorFn = jest.fn((state: any) => state.a + state.b);
      astrocyte.registerSelector('sum', selectorFn);

      astrocyte.setState('a', 5);
      astrocyte.setState('b', 10);

      // First call
      const result1 = astrocyte.select('sum');
      expect(selectorFn).toHaveBeenCalledTimes(1);

      // Second call - should use cached result
      const result2 = astrocyte.select('sum');
      expect(selectorFn).toHaveBeenCalledTimes(1); // Still 1
      expect(result1).toBe(result2);
    });

    it('should recompute selector when dependencies change', () => {
      const selectorFn = jest.fn((state: any) => state.items?.length ?? 0);
      astrocyte.registerSelector('itemCount', selectorFn);

      astrocyte.setState('items', [1, 2, 3]);
      expect(astrocyte.select('itemCount')).toBe(3);

      astrocyte.setState('items', [1, 2, 3, 4]);
      expect(astrocyte.select('itemCount')).toBe(4);
      expect(selectorFn).toHaveBeenCalledTimes(2);
    });

    it('should support selector dependencies', () => {
      astrocyte.registerSelector('total', (state: any) =>
        (state.prices ?? []).reduce((sum: number, p: number) => sum + p, 0),
      );

      astrocyte.registerSelector('totalWithTax', (state: any) => astrocyte.select('total') * 1.1);

      astrocyte.setState('prices', [10, 20, 30]);
      expect(astrocyte.select('totalWithTax')).toBe(66); // 60 * 1.1
    });
  });

  describe('Time-Travel Debugging', () => {
    beforeEach(async () => {
      astrocyte = new VisualAstrocyte({
        id: 'time-travel-test',
        maxHistorySize: 5,
        enableTimeTravel: true,
      });
      await astrocyte.activate();
    });

    it('should record state history', () => {
      astrocyte.setState('counter', 0);
      astrocyte.setState('counter', 1);
      astrocyte.setState('counter', 2);

      const history = astrocyte.getHistory();
      expect(history).toHaveLength(3);
    });

    it('should limit history size', () => {
      for (let i = 0; i < 10; i++) {
        astrocyte.setState('value', i);
      }

      const history = astrocyte.getHistory();
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should undo state change', () => {
      astrocyte.setState('value', 1);
      astrocyte.setState('value', 2);
      astrocyte.setState('value', 3);

      expect(astrocyte.getState('value')).toBe(3);

      astrocyte.undo();
      expect(astrocyte.getState('value')).toBe(2);
    });

    it('should redo state change', () => {
      astrocyte.setState('value', 1);
      astrocyte.setState('value', 2);

      astrocyte.undo();
      expect(astrocyte.getState('value')).toBe(1);

      astrocyte.redo();
      expect(astrocyte.getState('value')).toBe(2);
    });

    it('should not undo beyond history', () => {
      astrocyte.setState('value', 1);

      astrocyte.undo();
      astrocyte.undo(); // Try to undo again

      // Should still work without error
      expect(astrocyte.getState()).toBeDefined();
    });

    it('should clear redo stack on new state change', () => {
      astrocyte.setState('value', 1);
      astrocyte.setState('value', 2);
      astrocyte.undo();

      // New change should clear redo stack
      astrocyte.setState('value', 3);

      astrocyte.redo(); // Should not go to 2
      expect(astrocyte.getState('value')).toBe(3);
    });

    it('should support jumping to specific history index', () => {
      astrocyte.setState('value', 1);
      astrocyte.setState('value', 2);
      astrocyte.setState('value', 3);

      astrocyte.jumpToState(0);
      expect(astrocyte.getState('value')).toBe(1);
    });
  });

  describe('State Persistence', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should export state snapshot', () => {
      astrocyte.setState('user.name', 'Alice');
      astrocyte.setState('user.age', 30);
      astrocyte.setState('theme', 'dark');

      const snapshot = astrocyte.exportSnapshot();
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

      astrocyte.importSnapshot(snapshot);

      expect(astrocyte.getState('user.name')).toBe('Bob');
      expect(astrocyte.getState('settings.notifications')).toBe(true);
    });

    it('should preserve state across deactivation when using snapshots', async () => {
      astrocyte.setState('preserved', 'data');
      const snapshot = astrocyte.exportSnapshot();

      await astrocyte.deactivate();

      const newAstrocyte = new VisualAstrocyte({
        id: 'restored',
        maxHistorySize: 50,
        enableTimeTravel: false,
      });
      await newAstrocyte.activate();
      newAstrocyte.importSnapshot(snapshot);

      expect(newAstrocyte.getState('preserved')).toBe('data');

      await newAstrocyte.deactivate();
    });
  });

  describe('State Middleware', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should apply middleware on state changes', () => {
      const middleware = jest.fn((path, value, prevValue) => {
        return value;
      });

      astrocyte.addMiddleware(middleware);
      astrocyte.setState('test', 'value');

      expect(middleware).toHaveBeenCalledWith('test', 'value', undefined);
    });

    it('should allow middleware to transform values', () => {
      const uppercaseMiddleware = (path: string, value: any) => {
        if (typeof value === 'string') {
          return value.toUpperCase();
        }
        return value;
      };

      astrocyte.addMiddleware(uppercaseMiddleware);
      astrocyte.setState('name', 'alice');

      expect(astrocyte.getState('name')).toBe('ALICE');
    });

    it('should execute multiple middleware in order', () => {
      const order: string[] = [];

      astrocyte.addMiddleware((path, value) => {
        order.push('first');
        return value;
      });

      astrocyte.addMiddleware((path, value) => {
        order.push('second');
        return value;
      });

      astrocyte.setState('test', 1);
      expect(order).toEqual(['first', 'second']);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should handle large state efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        astrocyte.setState(`items.${i}`, { id: i, value: `item-${i}` });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in < 1s
    });

    it('should handle many subscribers efficiently', () => {
      for (let i = 0; i < 100; i++) {
        astrocyte.subscribe(`path.${i}`, () => {});
      }

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        astrocyte.setState(`path.${i}`, i);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should handle invalid state paths gracefully', () => {
      expect(() => {
        astrocyte.setState('', 'value');
      }).not.toThrow();
    });

    it('should handle circular references in state', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      expect(() => {
        astrocyte.setState('circular', circular);
      }).not.toThrow();
    });

    it('should handle errors in selector functions', () => {
      astrocyte.registerSelector('error', () => {
        throw new Error('Selector error');
      });

      expect(() => {
        astrocyte.select('error');
      }).toThrow('Selector error');
    });

    it('should handle errors in middleware', () => {
      astrocyte.addMiddleware(() => {
        throw new Error('Middleware error');
      });

      expect(() => {
        astrocyte.setState('test', 'value');
      }).toThrow('Middleware error');
    });
  });
});
