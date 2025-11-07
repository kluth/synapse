import { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';

describe('Heart', () => {
  let heart: Heart;

  beforeEach(() => {
    heart = new Heart();
  });

  afterEach(async () => {
    await heart.stop();
  });

  describe('Basic Messaging', () => {
    it('should publish and consume messages', async () => {
      const messages: BloodCell[] = [];

      heart.subscribe('test-topic', (cell) => {
        messages.push(cell);
      });

      await heart.publish('test-topic', new BloodCell({ data: 'hello' }));

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(messages).toHaveLength(1);
      expect(messages[0].payload).toEqual({ data: 'hello' });
    });

    it('should support multiple subscribers', async () => {
      const messages1: BloodCell[] = [];
      const messages2: BloodCell[] = [];

      heart.subscribe('test-topic', (cell) => messages1.push(cell));
      heart.subscribe('test-topic', (cell) => messages2.push(cell));

      await heart.publish('test-topic', new BloodCell({ data: 'hello' }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
    });

    it('should not deliver to unsubscribed topics', async () => {
      const messages: BloodCell[] = [];

      heart.subscribe('topic-a', (cell) => messages.push(cell));
      await heart.publish('topic-b', new BloodCell({ data: 'hello' }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(messages).toHaveLength(0);
    });

    it('should support unsubscribe', async () => {
      const messages: BloodCell[] = [];

      const unsubscribe = heart.subscribe('test-topic', (cell) => messages.push(cell));
      unsubscribe();

      await heart.publish('test-topic', new BloodCell({ data: 'hello' }));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(messages).toHaveLength(0);
    });
  });

  describe('Priority Queues', () => {
    it('should process high priority messages first', async () => {
      const processedOrder: number[] = [];

      heart.subscribe('test-topic', (cell) => {
        processedOrder.push(cell.payload.id);
      });

      // Publish in order: low, medium, high
      await heart.publish('test-topic', new BloodCell({ id: 1 }, { priority: 0 }));
      await heart.publish('test-topic', new BloodCell({ id: 2 }, { priority: 5 }));
      await heart.publish('test-topic', new BloodCell({ id: 3 }, { priority: 10 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should process in order: high, medium, low
      expect(processedOrder).toEqual([3, 2, 1]);
    });

    it('should process same priority messages in FIFO order', async () => {
      const processedOrder: number[] = [];

      heart.subscribe('test-topic', (cell) => {
        processedOrder.push(cell.payload.id);
      });

      await heart.publish('test-topic', new BloodCell({ id: 1 }, { priority: 5 }));
      await heart.publish('test-topic', new BloodCell({ id: 2 }, { priority: 5 }));
      await heart.publish('test-topic', new BloodCell({ id: 3 }, { priority: 5 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(processedOrder).toEqual([1, 2, 3]);
    });
  });

  describe('Dead Letter Queue', () => {
    it('should move failed messages to DLQ', async () => {
      const dlqMessages: BloodCell[] = [];

      heart.onDeadLetter((cell) => {
        dlqMessages.push(cell);
      });

      heart.subscribe('test-topic', () => {
        throw new Error('Processing failed');
      });

      await heart.publish('test-topic', new BloodCell({ data: 'test' }));
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(dlqMessages).toHaveLength(1);
      expect(dlqMessages[0].payload).toEqual({ data: 'test' });
    });

    it('should retry before moving to DLQ', async () => {
      let attempts = 0;
      const dlqMessages: BloodCell[] = [];

      heart.onDeadLetter((cell) => dlqMessages.push(cell));

      heart.subscribe('test-topic', () => {
        attempts++;
        throw new Error('Processing failed');
      });

      await heart.publish('test-topic', new BloodCell({ data: 'test' }), { maxRetries: 3 });

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(attempts).toBeGreaterThanOrEqual(2); // At least initial + some retries
      expect(dlqMessages).toHaveLength(1);
    });

    it('should not retry on success', async () => {
      let attempts = 0;
      const dlqMessages: BloodCell[] = [];

      heart.onDeadLetter((cell) => dlqMessages.push(cell));

      heart.subscribe('test-topic', () => {
        attempts++;
        // Success - no error
      });

      await heart.publish('test-topic', new BloodCell({ data: 'test' }), { maxRetries: 3 });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(attempts).toBe(1); // Only once
      expect(dlqMessages).toHaveLength(0);
    });
  });

  describe('Message Routing', () => {
    it('should route by pattern matching', async () => {
      const userMessages: BloodCell[] = [];
      const orderMessages: BloodCell[] = [];

      heart.subscribe('user.*', (cell) => userMessages.push(cell));
      heart.subscribe('order.*', (cell) => orderMessages.push(cell));

      await heart.publish('user.created', new BloodCell({ id: 1 }));
      await heart.publish('user.updated', new BloodCell({ id: 2 }));
      await heart.publish('order.created', new BloodCell({ id: 3 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(userMessages).toHaveLength(2);
      expect(orderMessages).toHaveLength(1);
    });

    it('should route by message type', async () => {
      const messages: BloodCell[] = [];

      heart.subscribe('test-topic', (cell) => {
        if (cell.type === 'UserCreated') {
          messages.push(cell);
        }
      });

      await heart.publish('test-topic', new BloodCell({ id: 1 }, { type: 'UserCreated' }));
      await heart.publish('test-topic', new BloodCell({ id: 2 }, { type: 'UserUpdated' }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages).toHaveLength(1);
    });
  });

  describe('Delivery Guarantees', () => {
    it('should support at-least-once delivery', async () => {
      const messages: BloodCell[] = [];
      let shouldFail = true;

      heart.subscribe('test-topic', (cell) => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('First attempt failed');
        }
        messages.push(cell);
      });

      await heart.publish('test-topic', new BloodCell({ data: 'test' }), {
        deliveryMode: 'at-least-once',
        maxRetries: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(messages).toHaveLength(1); // Eventually delivered
    });

    it('should track message acknowledgment', async () => {
      const acks: string[] = [];

      heart.onAcknowledge((cell) => {
        acks.push(cell.id);
      });

      heart.subscribe('test-topic', (cell) => {
        cell.acknowledge();
      });

      const cell = new BloodCell({ data: 'test' });
      await heart.publish('test-topic', cell);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(acks).toContain(cell.id);
    });
  });

  describe('Message Persistence', () => {
    it('should persist messages when enabled', async () => {
      const persistentHeart = new Heart({ persistence: true });

      await persistentHeart.publish('test-topic', new BloodCell({ data: 'test' }));

      const persisted = await persistentHeart.getPersistedMessages('test-topic');
      expect(persisted).toHaveLength(1);

      await persistentHeart.stop();
    });

    it('should replay persisted messages', async () => {
      const messages: BloodCell[] = [];
      const persistentHeart = new Heart({ persistence: true });

      // Publish messages (they go to both queue and persistence)
      await persistentHeart.publish('test-topic', new BloodCell({ data: 'test1' }));
      await persistentHeart.publish('test-topic', new BloodCell({ data: 'test2' }));

      // Wait for queue to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now subscribe and replay persisted messages
      persistentHeart.subscribe('test-topic', (cell) => messages.push(cell));
      await persistentHeart.replay('test-topic');

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should receive 2 messages from replay
      expect(messages).toHaveLength(2);
      expect(messages[0].payload).toEqual({ data: 'test1' });
      expect(messages[1].payload).toEqual({ data: 'test2' });

      await persistentHeart.stop();
    });
  });

  describe('TTL and Expiration', () => {
    it('should not deliver expired messages', async () => {
      const messages: BloodCell[] = [];
      heart.subscribe('test-topic', (cell) => messages.push(cell));

      // Create an already expired message
      const expiredCell = new BloodCell({ data: 'test' }, { ttl: 1 });
      await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for expiration

      await heart.publish('test-topic', expiredCell);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(messages).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should track message statistics', async () => {
      heart.subscribe('test-topic', () => {});

      await heart.publish('test-topic', new BloodCell({ data: 1 }));
      await heart.publish('test-topic', new BloodCell({ data: 2 }));
      await heart.publish('test-topic', new BloodCell({ data: 3 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = heart.getStats();
      expect(stats.published).toBeGreaterThanOrEqual(3);
      expect(stats.delivered).toBeGreaterThanOrEqual(3);
    });
  });
});
