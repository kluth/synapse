import { EventBus } from './EventBus';
import { z } from 'zod';

// Test event schemas
const UserRegisteredSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  timestamp: z.date(),
});

type UserRegistered = z.infer<typeof UserRegisteredSchema>;

describe('EventBus - Pub-Sub Communication', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('initialization', () => {
    it('should create an event bus', () => {
      expect(eventBus).toBeDefined();
    });
  });

  describe('event subscription and emission', () => {
    it('should subscribe to and receive events', async () => {
      const handler = jest.fn();

      eventBus.on('user:registered', handler);

      const event: UserRegistered = {
        userId: '123',
        email: 'alice@example.com',
        timestamp: new Date(),
      };

      await eventBus.emit('user:registered', event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should support multiple subscribers for same event', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);
      eventBus.on('test:event', handler3);

      await eventBus.emit('test:event', { data: 'test' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    it('should not call handlers for different events', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('event:one', handler1);
      eventBus.on('event:two', handler2);

      await eventBus.emit('event:one', { data: 'one' });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('unsubscription', () => {
    it('should unsubscribe specific handler', async () => {
      const handler = jest.fn();

      eventBus.on('test:event', handler);
      await eventBus.emit('test:event', {});
      expect(handler).toHaveBeenCalledTimes(1);

      eventBus.off('test:event', handler);
      await eventBus.emit('test:event', {});
      expect(handler).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should only remove specified handler, not others', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on('test:event', handler1);
      eventBus.on('test:event', handler2);

      eventBus.off('test:event', handler1);

      await eventBus.emit('test:event', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should support unsubscribe via returned function', async () => {
      const handler = jest.fn();

      const unsubscribe = eventBus.on('test:event', handler);

      await eventBus.emit('test:event', {});
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await eventBus.emit('test:event', {});
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('one-time listeners', () => {
    it('should only fire once', async () => {
      const handler = jest.fn();

      eventBus.once('test:event', handler);

      await eventBus.emit('test:event', {});
      await eventBus.emit('test:event', {});
      await eventBus.emit('test:event', {});

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('wildcard subscriptions', () => {
    it('should match wildcard patterns', async () => {
      const handler = jest.fn();

      eventBus.on('user:*', handler);

      await eventBus.emit('user:registered', { data: '1' });
      await eventBus.emit('user:updated', { data: '2' });
      await eventBus.emit('user:deleted', { data: '3' });

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should not match non-matching patterns', async () => {
      const handler = jest.fn();

      eventBus.on('user:*', handler);

      await eventBus.emit('order:created', {});

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple wildcard levels', async () => {
      const handler = jest.fn();

      eventBus.on('app:*:*', handler);

      await eventBus.emit('app:user:created', {});
      await eventBus.emit('app:order:updated', {});

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('schema validation', () => {
    it('should validate events against schema', async () => {
      const handler = jest.fn();

      eventBus.on('user:registered', handler, { schema: UserRegisteredSchema });

      const validEvent: UserRegistered = {
        userId: '123',
        email: 'test@example.com',
        timestamp: new Date(),
      };

      await eventBus.emit('user:registered', validEvent);

      expect(handler).toHaveBeenCalledWith(validEvent);
    });

    it('should reject invalid events', async () => {
      const handler = jest.fn();

      eventBus.on('user:registered', handler, { schema: UserRegisteredSchema });

      const invalidEvent = {
        userId: '123',
        email: 'not-an-email', // Invalid email
        timestamp: new Date(),
      };

      await expect(eventBus.emit('user:registered', invalidEvent)).rejects.toThrow();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('async handlers', () => {
    it('should handle async handlers', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      eventBus.on('test:event', handler);

      await eventBus.emit('test:event', {});

      expect(handler).toHaveBeenCalled();
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = jest.fn();

      eventBus.on('test:event', errorHandler);
      eventBus.on('test:event', successHandler);

      await eventBus.emit('test:event', {});

      // Success handler should still be called even if one fails
      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe('event history', () => {
    it('should track emitted events when history is enabled', async () => {
      eventBus = new EventBus({ historySize: 10 });

      await eventBus.emit('event1', { data: 'one' });
      await eventBus.emit('event2', { data: 'two' });
      await eventBus.emit('event3', { data: 'three' });

      const history = eventBus.getHistory();

      expect(history).toHaveLength(3);
      expect(history[0]?.type).toBe('event1');
      expect(history[1]?.type).toBe('event2');
      expect(history[2]?.type).toBe('event3');
    });

    it('should limit history size', async () => {
      eventBus = new EventBus({ historySize: 2 });

      await eventBus.emit('event1', {});
      await eventBus.emit('event2', {});
      await eventBus.emit('event3', {});

      const history = eventBus.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0]?.type).toBe('event2');
      expect(history[1]?.type).toBe('event3');
    });
  });

  describe('event statistics', () => {
    it('should track event emission statistics', async () => {
      await eventBus.emit('event:a', {});
      await eventBus.emit('event:a', {});
      await eventBus.emit('event:b', {});

      const stats = eventBus.getStats();

      expect(stats.totalEmitted).toBe(3);
      expect(stats.eventCounts['event:a']).toBe(2);
      expect(stats.eventCounts['event:b']).toBe(1);
    });

    it('should track subscriber count', () => {
      eventBus.on('event:a', jest.fn());
      eventBus.on('event:a', jest.fn());
      eventBus.on('event:b', jest.fn());

      const stats = eventBus.getStats();

      expect(stats.subscriberCounts['event:a']).toBe(2);
      expect(stats.subscriberCounts['event:b']).toBe(1);
    });
  });
});
