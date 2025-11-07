import { Heart } from '../core/Heart';
import { Artery } from '../core/Artery';
import { Vein } from '../core/Vein';
import { BloodCell } from '../core/BloodCell';
import {
  RequestResponse,
  PublishSubscribe,
  FireAndForget,
  Saga,
  EventSourcing,
} from '../patterns';

describe('Circulatory System Integration', () => {
  describe('Heart + Artery + Vein Integration', () => {
    let heart: Heart;
    let artery: Artery;
    let vein: Vein;

    beforeEach(async () => {
      heart = new Heart();
      artery = new Artery('outbound');
      vein = new Vein('inbound');

      await artery.start();
      await vein.start();
    });

    afterEach(async () => {
      await artery.stop();
      await vein.stop();
      await heart.stop();
    });

    it('should flow messages from Artery through Heart to Vein', async () => {
      const received: BloodCell[] = [];

      // Connect components
      artery.onData(async (cell) => {
        await heart.publish('test-topic', cell);
      });

      heart.subscribe('test-topic', async (cell) => {
        await vein.receive(cell);
      });

      vein.onMessage((cell) => {
        received.push(cell);
      });

      // Send through artery
      await artery.send(new BloodCell({ data: 'test' }));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(received).toHaveLength(1);
      expect(received[0].payload).toEqual({ data: 'test' });
    });

    it('should handle backpressure across components', async () => {
      const received: BloodCell[] = [];

      artery = new Artery('outbound', { maxBufferSize: 5 });
      await artery.start();

      artery.onData(async (cell) => {
        await heart.publish('test-topic', cell);
      });

      heart.subscribe('test-topic', async (cell) => {
        await vein.receive(cell);
      });

      vein.onMessage((cell) => {
        received.push(cell);
      });

      // Send messages
      for (let i = 0; i < 3; i++) {
        await artery.send(new BloodCell({ id: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(received.length).toBeGreaterThanOrEqual(3);
      await artery.stop();
    });

    it('should preserve message order through pipeline', async () => {
      const received: number[] = [];

      artery.onData(async (cell) => {
        await heart.publish('ordered-topic', cell);
      });

      heart.subscribe('ordered-topic', async (cell) => {
        await vein.receive(cell);
      });

      vein.onMessage((cell) => {
        received.push(cell.payload.id);
      });

      for (let i = 1; i <= 10; i++) {
        await artery.send(new BloodCell({ id: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(received).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('Multi-Pattern Integration', () => {
    let heart: Heart;

    beforeEach(() => {
      heart = new Heart({ persistence: true });
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should support Request-Response with Publish-Subscribe', async () => {
      const rr = new RequestResponse(heart);
      const pubsub = new PublishSubscribe(heart);

      const notifications: any[] = [];

      // Setup request handler that also publishes event
      rr.onRequest('createUser', async (request) => {
        const user = { id: 1, ...request.payload };
        await pubsub.publish('user.created', user);
        return user;
      });

      // Subscribe to events
      pubsub.subscribe('user.created', (data) => {
        notifications.push(data);
      });

      // Make request
      const result = await rr.request('createUser', { name: 'John' });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(result.name).toBe('John');
      expect(notifications).toHaveLength(1);
      expect(notifications[0].name).toBe('John');
    });

    it('should combine Saga with Event Sourcing', async () => {
      const saga = new Saga(heart);
      const es = new EventSourcing(heart);

      const result = await saga.execute([
        {
          name: 'createOrder',
          action: async () => {
            await es.append('order-1', 'OrderCreated', { total: 100 });
            return { orderId: 1 };
          },
          compensate: async () => {
            await es.append('order-1', 'OrderCancelled', {});
          },
        },
        {
          name: 'processPayment',
          action: async () => {
            await es.append('order-1', 'PaymentProcessed', { amount: 100 });
            return { paymentId: 1 };
          },
          compensate: async () => {
            await es.append('order-1', 'PaymentRefunded', { amount: 100 });
          },
        },
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.success).toBe(true);

      const events = await es.replay('order-1');
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('OrderCreated');
      expect(events[1].type).toBe('PaymentProcessed');
    });
  });

  describe('Performance & Load', () => {
    let heart: Heart;

    beforeEach(() => {
      heart = new Heart({ maxQueueSize: 10000 });
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should handle 1000 messages quickly', async () => {
      const received: BloodCell[] = [];

      heart.subscribe('perf-test', (cell) => {
        received.push(cell);
      });

      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        await heart.publish('perf-test', new BloodCell({ id: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const elapsed = Date.now() - start;

      expect(received.length).toBeGreaterThanOrEqual(900); // At least 90% delivered
      expect(elapsed).toBeLessThan(2000); // Under 2 seconds
    });

    it('should maintain throughput under load', async () => {
      let processed = 0;

      heart.subscribe('throughput-test', () => {
        processed++;
      });

      const messagesToSend = 500;

      for (let i = 0; i < messagesToSend; i++) {
        await heart.publish('throughput-test', new BloodCell({ id: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const stats = heart.getStats();

      expect(stats.published).toBeGreaterThanOrEqual(messagesToSend);
      expect(stats.delivered).toBeGreaterThanOrEqual(400); // At least 80%
      expect(processed).toBeGreaterThanOrEqual(400);
    });

    it('should handle burst traffic', async () => {
      const received: BloodCell[] = [];

      heart.subscribe('burst-test', (cell) => {
        received.push(cell);
      });

      // Send burst of 100 messages immediately
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(heart.publish('burst-test', new BloodCell({ id: i })));
      }

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(received.length).toBeGreaterThanOrEqual(90);
    });

    it('should handle multiple topics concurrently', async () => {
      const topic1: BloodCell[] = [];
      const topic2: BloodCell[] = [];
      const topic3: BloodCell[] = [];

      heart.subscribe('topic-1', (cell) => topic1.push(cell));
      heart.subscribe('topic-2', (cell) => topic2.push(cell));
      heart.subscribe('topic-3', (cell) => topic3.push(cell));

      // Publish to all topics concurrently
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          heart.publish('topic-1', new BloodCell({ id: i })),
          heart.publish('topic-2', new BloodCell({ id: i })),
          heart.publish('topic-3', new BloodCell({ id: i }))
        );
      }

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 800));

      expect(topic1.length).toBeGreaterThanOrEqual(80);
      expect(topic2.length).toBeGreaterThanOrEqual(80);
      expect(topic3.length).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Concurrency & Race Conditions', () => {
    let heart: Heart;

    beforeEach(() => {
      heart = new Heart();
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should handle concurrent subscribe and publish', async () => {
      const received: BloodCell[] = [];

      // Concurrent subscribe
      const subscribePromises = [];
      for (let i = 0; i < 10; i++) {
        subscribePromises.push(
          new Promise<void>(resolve => {
            heart.subscribe('concurrent-topic', (cell) => {
              received.push(cell);
            });
            resolve();
          })
        );
      }

      await Promise.all(subscribePromises);

      // Concurrent publish
      const publishPromises = [];
      for (let i = 0; i < 10; i++) {
        publishPromises.push(
          heart.publish('concurrent-topic', new BloodCell({ id: i }))
        );
      }

      await Promise.all(publishPromises);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Each message should be delivered to all 10 subscribers
      expect(received.length).toBeGreaterThanOrEqual(90); // 10 messages * 10 subscribers = 100
    });

    it('should handle concurrent message processing', async () => {
      let processedCount = 0;
      const processingTimes: number[] = [];

      heart.subscribe('concurrent-processing', async (cell) => {
        const start = Date.now();
        // Simulate some processing
        await new Promise(resolve => setTimeout(resolve, 10));
        processedCount++;
        processingTimes.push(Date.now() - start);
      });

      // Send 50 messages concurrently
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(heart.publish('concurrent-processing', new BloodCell({ id: i })));
      }

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(processedCount).toBeGreaterThanOrEqual(45);
    });

    it('should maintain message order with concurrent publishers', async () => {
      const received: any[] = [];

      heart.subscribe('order-test', (cell) => {
        received.push(cell.payload);
      });

      // Multiple publishers sending to same topic
      await Promise.all([
        (async () => {
          for (let i = 0; i < 10; i++) {
            await heart.publish('order-test', new BloodCell({ source: 'A', id: i }));
          }
        })(),
        (async () => {
          for (let i = 0; i < 10; i++) {
            await heart.publish('order-test', new BloodCell({ source: 'B', id: i }));
          }
        })(),
      ]);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Check that messages from each source are in order
      const sourceA = received.filter(m => m.source === 'A');
      const sourceB = received.filter(m => m.source === 'B');

      expect(sourceA.length).toBe(10);
      expect(sourceB.length).toBe(10);

      // Verify order within each source
      for (let i = 1; i < sourceA.length; i++) {
        expect(sourceA[i].id).toBeGreaterThan(sourceA[i - 1].id);
      }

      for (let i = 1; i < sourceB.length; i++) {
        expect(sourceB[i].id).toBeGreaterThan(sourceB[i - 1].id);
      }
    });
  });

  describe('Error Recovery', () => {
    let heart: Heart;

    beforeEach(() => {
      heart = new Heart();
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should recover from subscriber errors', async () => {
      const received: BloodCell[] = [];
      let errorCount = 0;

      // Subscriber that fails sometimes
      heart.subscribe('error-recovery', (cell) => {
        if (cell.payload.id % 3 === 0) {
          errorCount++;
          throw new Error('Processing error');
        }
        received.push(cell);
      });

      for (let i = 0; i < 10; i++) {
        await heart.publish('error-recovery', new BloodCell({ id: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(errorCount).toBeGreaterThan(0);
      expect(received.length).toBeGreaterThan(0);
      expect(received.length + errorCount).toBeGreaterThanOrEqual(9);
    });

    it('should handle DLQ with retry logic', async () => {
      const dlq: BloodCell[] = [];
      let attempts = 0;

      heart.onDeadLetter((cell) => {
        dlq.push(cell);
      });

      heart.subscribe('dlq-test', () => {
        attempts++;
        throw new Error('Always fails');
      });

      await heart.publish(
        'dlq-test',
        new BloodCell({ data: 'test' }),
        { maxRetries: 2 }
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(attempts).toBeGreaterThanOrEqual(2);
      expect(dlq).toHaveLength(1);
    });

    it('should handle subscriber crashes gracefully', async () => {
      const received1: BloodCell[] = [];
      const received2: BloodCell[] = [];

      // First subscriber crashes
      heart.subscribe('crash-test', () => {
        throw new Error('Crash!');
      });

      // Second subscriber should still work
      heart.subscribe('crash-test', (cell) => {
        received2.push(cell);
      });

      await heart.publish('crash-test', new BloodCell({ data: 'test' }));
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(received2).toHaveLength(1);
    });
  });

  describe('Stream Transformations', () => {
    it('should chain Artery transformations with Vein processing', async () => {
      const artery = new Artery('transform-artery');
      const vein = new Vein('transform-vein');
      const heart = new Heart();

      await artery.start();
      await vein.start();

      const received: any[] = [];

      // Setup transformation pipeline
      artery
        .transform((cell) => new BloodCell({ value: cell.payload.value * 2 }))
        .transform((cell) => new BloodCell({ value: cell.payload.value + 10 }))
        .filter((cell) => cell.payload.value > 20);

      artery.onData(async (cell) => {
        await heart.publish('transform-topic', cell);
      });

      heart.subscribe('transform-topic', async (cell) => {
        await vein.receive(cell);
      });

      vein.onMessage((cell) => {
        received.push(cell.payload.value);
      });

      // Test: (5 * 2) + 10 = 20 (filtered out)
      await artery.send(new BloodCell({ value: 5 }));

      // Test: (10 * 2) + 10 = 30 (passes)
      await artery.send(new BloodCell({ value: 10 }));

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(received).toEqual([30]);

      await artery.stop();
      await vein.stop();
      await heart.stop();
    });

    it('should handle batch transformations', async () => {
      const artery = new Artery('batch-artery', { batchSize: 3 });
      const vein = new Vein('batch-vein', { batchSize: 3 });
      const heart = new Heart();

      await artery.start();
      await vein.start();

      const batches: any[] = [];

      artery.onBatch(async (cells) => {
        // Batch transform: sum all values
        const sum = cells.reduce((acc, cell) => acc + cell.payload.value, 0);
        await heart.publish('batch-topic', new BloodCell({ sum }));
      });

      heart.subscribe('batch-topic', async (cell) => {
        await vein.receive(cell);
      });

      vein.onBatch((cells) => {
        batches.push(cells);
      });

      await artery.send(new BloodCell({ value: 1 }));
      await artery.send(new BloodCell({ value: 2 }));
      await artery.send(new BloodCell({ value: 3 }));

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(batches.length).toBeGreaterThanOrEqual(1);

      await artery.stop();
      await vein.stop();
      await heart.stop();
    });
  });

  describe('Complex Scenarios', () => {
    it('should implement a complete order processing workflow', async () => {
      const heart = new Heart({ persistence: true });
      const rr = new RequestResponse(heart);
      const pubsub = new PublishSubscribe(heart);
      const es = new EventSourcing(heart);
      const saga = new Saga(heart);

      const orderEvents: any[] = [];

      // Subscribe to order events
      es.onEvent('OrderCreated', (event) => orderEvents.push(event));
      es.onEvent('PaymentProcessed', (event) => orderEvents.push(event));
      es.onEvent('OrderShipped', (event) => orderEvents.push(event));

      // Order creation endpoint
      rr.onRequest('createOrder', async (request) => {
        const order = { id: Date.now(), ...request.payload };

        // Execute saga for order processing
        const result = await saga.execute([
          {
            name: 'createOrder',
            action: async () => {
              await es.append(`order-${order.id}`, 'OrderCreated', order);
              return order;
            },
            compensate: async () => {
              await es.append(`order-${order.id}`, 'OrderCancelled', {});
            },
          },
          {
            name: 'processPayment',
            action: async () => {
              await es.append(`order-${order.id}`, 'PaymentProcessed', { amount: order.total });
              return { success: true };
            },
            compensate: async () => {
              await es.append(`order-${order.id}`, 'PaymentRefunded', {});
            },
          },
          {
            name: 'ship',
            action: async () => {
              await es.append(`order-${order.id}`, 'OrderShipped', {});
              await pubsub.publish('order.completed', order);
              return { trackingNumber: '12345' };
            },
            compensate: async () => {},
          },
        ]);

        return result;
      });

      // Create order
      const result = await rr.request('createOrder', { total: 100, items: ['Widget'] });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(result.success).toBe(true);
      expect(orderEvents.length).toBeGreaterThanOrEqual(3);

      await heart.stop();
    });

    it('should implement microservices communication pattern', async () => {
      const heart = new Heart();
      const faf = new FireAndForget(heart);
      const pubsub = new PublishSubscribe(heart);

      const userServiceEvents: any[] = [];
      const orderServiceEvents: any[] = [];
      const notificationServiceEvents: any[] = [];

      // User Service
      pubsub.subscribe('user.created', (data) => {
        userServiceEvents.push({ service: 'user', event: 'created', data });
        // Notify other services
        faf.send('notify-user-created', data);
      });

      // Order Service listens for user created
      faf.onMessage('notify-user-created', (data) => {
        orderServiceEvents.push({ service: 'order', event: 'user-ready', data });
      });

      // Notification Service
      faf.onMessage('notify-user-created', (data) => {
        notificationServiceEvents.push({ service: 'notification', event: 'send-welcome', data });
      });

      // Trigger workflow
      await pubsub.publish('user.created', { id: 1, name: 'John' });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(userServiceEvents).toHaveLength(1);
      expect(orderServiceEvents).toHaveLength(1);
      expect(notificationServiceEvents).toHaveLength(1);

      await heart.stop();
    });
  });
});
