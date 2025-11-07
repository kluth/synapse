import { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';
import { RequestResponse, PublishSubscribe, FireAndForget, Saga, EventSourcing } from '../patterns';

describe('Message Patterns', () => {
  describe('Request-Response', () => {
    let heart: Heart;
    let rr: RequestResponse;

    beforeEach(() => {
      heart = new Heart();
      rr = new RequestResponse(heart);
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should send request and receive response', async () => {
      // Register handler
      rr.onRequest('echo', async (request) => {
        return { echo: request.payload };
      });

      // Send request
      const response = await rr.request('echo', { message: 'hello' });

      expect(response).toEqual({ echo: { message: 'hello' } });
    });

    it('should handle multiple concurrent requests', async () => {
      rr.onRequest('multiply', async (request) => {
        return { result: request.payload.value * 2 };
      });

      const results = await Promise.all([
        rr.request('multiply', { value: 1 }),
        rr.request('multiply', { value: 2 }),
        rr.request('multiply', { value: 3 }),
      ]);

      expect(results[0]).toEqual({ result: 2 });
      expect(results[1]).toEqual({ result: 4 });
      expect(results[2]).toEqual({ result: 6 });
    });

    it('should timeout on no response', async () => {
      rr.onRequest('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { done: true };
      });

      await expect(rr.request('slow', {}, { timeout: 100 })).rejects.toThrow('Request timeout');
    });

    it('should handle request errors', async () => {
      rr.onRequest('fail', async () => {
        throw new Error('Request failed');
      });

      await expect(rr.request('fail', {})).rejects.toThrow('Request failed');
    });

    it('should support request correlation', async () => {
      const correlations: string[] = [];

      rr.onRequest('track', async (request) => {
        correlations.push(request.correlationId!);
        return { ok: true };
      });

      await rr.request('track', {});
      await rr.request('track', {});

      expect(correlations).toHaveLength(2);
      expect(correlations[0]).not.toBe(correlations[1]);
    });
  });

  describe('Publish-Subscribe', () => {
    let heart: Heart;
    let pubsub: PublishSubscribe;

    beforeEach(() => {
      heart = new Heart();
      pubsub = new PublishSubscribe(heart);
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should publish to all subscribers', async () => {
      const received1: any[] = [];
      const received2: any[] = [];

      pubsub.subscribe('news', (data) => received1.push(data));
      pubsub.subscribe('news', (data) => received2.push(data));

      await pubsub.publish('news', { title: 'Breaking News' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);
      expect(received1[0]).toEqual({ title: 'Breaking News' });
    });

    it('should support topic wildcards', async () => {
      const received: any[] = [];

      pubsub.subscribe('user.*', (data) => received.push(data));

      await pubsub.publish('user.created', { id: 1 });
      await pubsub.publish('user.updated', { id: 2 });
      await pubsub.publish('order.created', { id: 3 });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toHaveLength(2);
    });

    it('should support unsubscribe', async () => {
      const received: any[] = [];

      const unsubscribe = pubsub.subscribe('news', (data) => {
        received.push(data);
      });

      await pubsub.publish('news', { id: 1 });
      await new Promise((resolve) => setTimeout(resolve, 50));

      unsubscribe();

      await pubsub.publish('news', { id: 2 });
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toHaveLength(1);
    });

    it('should handle subscriber errors gracefully', async () => {
      const received: any[] = [];

      pubsub.subscribe('test', () => {
        throw new Error('Subscriber error');
      });

      pubsub.subscribe('test', (data) => {
        received.push(data);
      });

      await pubsub.publish('test', { data: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second subscriber should still receive
      expect(received).toHaveLength(1);
    });
  });

  describe('Fire-and-Forget', () => {
    let heart: Heart;
    let faf: FireAndForget;

    beforeEach(() => {
      heart = new Heart();
      faf = new FireAndForget(heart);
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should send message without waiting for response', async () => {
      const received: any[] = [];

      faf.onMessage('notify', (data) => {
        received.push(data);
      });

      await faf.send('notify', { message: 'fire and forget' });

      // Should return immediately
      expect(received).toHaveLength(0);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toHaveLength(1);
    });

    it('should not block on slow handlers', async () => {
      faf.onMessage('slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      const start = Date.now();
      await faf.send('slow', {});
      const elapsed = Date.now() - start;

      // Should return quickly (< 100ms)
      expect(elapsed).toBeLessThan(100);
    });

    it('should support message priorities', async () => {
      const received: number[] = [];

      faf.onMessage('priority-test', (data) => {
        received.push(data.id);
      });

      await faf.send('priority-test', { id: 1 }, { priority: 0 });
      await faf.send('priority-test', { id: 2 }, { priority: 10 });
      await faf.send('priority-test', { id: 3 }, { priority: 5 });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should process in priority order: 2, 3, 1
      expect(received).toEqual([2, 3, 1]);
    });
  });

  describe('Saga', () => {
    let heart: Heart;
    let saga: Saga;

    beforeEach(() => {
      heart = new Heart();
      saga = new Saga(heart);
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should execute saga steps in sequence', async () => {
      const executed: string[] = [];

      const result = await saga.execute([
        {
          name: 'step1',
          action: async () => {
            executed.push('step1');
            return { step1: 'done' };
          },
          compensate: async () => {
            executed.push('compensate1');
          },
        },
        {
          name: 'step2',
          action: async () => {
            executed.push('step2');
            return { step2: 'done' };
          },
          compensate: async () => {
            executed.push('compensate2');
          },
        },
      ]);

      expect(executed).toEqual(['step1', 'step2']);
      expect(result.success).toBe(true);
    });

    it('should compensate on step failure', async () => {
      const executed: string[] = [];

      const result = await saga.execute([
        {
          name: 'step1',
          action: async () => {
            executed.push('step1');
            return { step1: 'done' };
          },
          compensate: async () => {
            executed.push('compensate1');
          },
        },
        {
          name: 'step2',
          action: async () => {
            executed.push('step2');
            throw new Error('Step 2 failed');
          },
          compensate: async () => {
            executed.push('compensate2');
          },
        },
        {
          name: 'step3',
          action: async () => {
            executed.push('step3');
            return { step3: 'done' };
          },
          compensate: async () => {
            executed.push('compensate3');
          },
        },
      ]);

      // Should execute step1, fail at step2, then compensate step1
      expect(executed).toEqual(['step1', 'step2', 'compensate1']);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Step 2 failed');
    });

    it('should track saga state', async () => {
      const states: string[] = [];

      saga.onStateChange((state) => {
        states.push(state);
      });

      await saga.execute([
        {
          name: 'step1',
          action: async () => ({ done: true }),
          compensate: async () => {},
        },
      ]);

      expect(states).toContain('started');
      expect(states).toContain('completed');
    });
  });

  describe('Event Sourcing', () => {
    let heart: Heart;
    let es: EventSourcing;

    beforeEach(() => {
      heart = new Heart({ persistence: true });
      es = new EventSourcing(heart);
    });

    afterEach(async () => {
      await heart.stop();
    });

    it('should store and replay events', async () => {
      // Store events
      await es.append('user-1', 'UserCreated', { name: 'John' });
      await es.append('user-1', 'UserUpdated', { email: 'john@example.com' });
      await es.append('user-1', 'UserUpdated', { age: 30 });

      // Replay events
      const events = await es.replay('user-1');

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('UserCreated');
      expect(events[1].type).toBe('UserUpdated');
      expect(events[2].type).toBe('UserUpdated');
    });

    it('should rebuild state from events', async () => {
      await es.append('account-1', 'AccountCreated', { balance: 0 });
      await es.append('account-1', 'MoneyDeposited', { amount: 100 });
      await es.append('account-1', 'MoneyWithdrawn', { amount: 30 });

      const state = await es.rebuildState('account-1', (state: any, event: any) => {
        switch (event.type) {
          case 'AccountCreated':
            return { balance: event.payload.balance };
          case 'MoneyDeposited':
            return { balance: state.balance + event.payload.amount };
          case 'MoneyWithdrawn':
            return { balance: state.balance - event.payload.amount };
          default:
            return state;
        }
      });

      expect(state.balance).toBe(70);
    });

    it('should support event snapshots', async () => {
      // Append many events
      for (let i = 0; i < 10; i++) {
        await es.append('entity-1', 'EventType', { count: i });
      }

      // Create snapshot
      await es.createSnapshot('entity-1', { count: 9 });

      // Append more events
      await es.append('entity-1', 'EventType', { count: 10 });
      await es.append('entity-1', 'EventType', { count: 11 });

      // Replay from snapshot
      const events = await es.replayFromSnapshot('entity-1');

      // Should only get events after snapshot
      expect(events.length).toBeLessThanOrEqual(3); // Snapshot + 2 events
    });

    it('should support event projections', async () => {
      const projection: any = {
        totalUsers: 0,
        totalOrders: 0,
      };

      es.onEvent('UserCreated', () => {
        projection.totalUsers++;
      });

      es.onEvent('OrderCreated', () => {
        projection.totalOrders++;
      });

      await es.append('stream-1', 'UserCreated', { name: 'Alice' });
      await es.append('stream-1', 'UserCreated', { name: 'Bob' });
      await es.append('stream-1', 'OrderCreated', { product: 'Widget' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(projection.totalUsers).toBe(2);
      expect(projection.totalOrders).toBe(1);
    });
  });
});
