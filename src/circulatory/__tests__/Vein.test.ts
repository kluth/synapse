import { Vein } from '../core/Vein';
import { BloodCell } from '../core/BloodCell';

describe('Vein', () => {
  describe('Basic Stream Operations', () => {
    it('should create a vein stream', () => {
      const vein = new Vein('test-stream');
      expect(vein.name).toBe('test-stream');
      expect(vein.isActive()).toBe(false);
    });

    it('should start and stop stream', async () => {
      const vein = new Vein('test-stream');

      await vein.start();
      expect(vein.isActive()).toBe(true);

      await vein.stop();
      expect(vein.isActive()).toBe(false);
    });

    it('should receive messages', async () => {
      const vein = new Vein('test-stream');
      const received: BloodCell[] = [];

      await vein.start();

      vein.onMessage((cell) => {
        received.push(cell);
      });

      // Simulate incoming message
      await vein.receive(new BloodCell({ data: 'test' }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toHaveLength(1);
      expect(received[0].payload).toEqual({ data: 'test' });

      await vein.stop();
    });

    it('should handle multiple messages', async () => {
      const vein = new Vein('test-stream');
      const received: BloodCell[] = [];

      await vein.start();

      vein.onMessage((cell) => {
        received.push(cell);
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));
      await vein.receive(new BloodCell({ data: 3 }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toHaveLength(3);

      await vein.stop();
    });
  });

  describe('Message Acknowledgment', () => {
    it('should track message acknowledgment', async () => {
      const vein = new Vein('test-stream');
      const acks: string[] = [];

      await vein.start();

      vein.onAcknowledge((cell) => {
        acks.push(cell.id);
      });

      vein.onMessage((cell) => {
        cell.acknowledge();
      });

      const cell = new BloodCell({ data: 'test' });
      await vein.receive(cell);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(acks).toContain(cell.id);

      await vein.stop();
    });

    it('should support manual acknowledgment', async () => {
      const vein = new Vein('test-stream', { autoAck: false });
      const acks: string[] = [];

      await vein.start();

      vein.onAcknowledge((cell) => {
        acks.push(cell.id);
      });

      let receivedCell: BloodCell | null = null;
      vein.onMessage((cell) => {
        receivedCell = cell;
      });

      const cell = new BloodCell({ data: 'test' });
      await vein.receive(cell);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Not acknowledged yet
      expect(acks).toHaveLength(0);

      // Manual acknowledgment
      await vein.acknowledge(receivedCell!);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(acks).toHaveLength(1);

      await vein.stop();
    });

    it('should retry unacknowledged messages', async () => {
      const vein = new Vein('test-stream', {
        autoAck: false,
        ackTimeout: 100,
      });

      let receiveCount = 0;

      await vein.start();

      vein.onMessage(() => {
        receiveCount++;
        // Don't acknowledge
      });

      await vein.receive(new BloodCell({ data: 'test' }));

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should receive at least twice (initial + retry)
      expect(receiveCount).toBeGreaterThanOrEqual(2);

      await vein.stop();
    });

    it('should not retry acknowledged messages', async () => {
      const vein = new Vein('test-stream', {
        autoAck: false,
        ackTimeout: 100,
      });

      let receiveCount = 0;

      await vein.start();

      vein.onMessage((cell) => {
        receiveCount++;
        cell.acknowledge();
      });

      await vein.receive(new BloodCell({ data: 'test' }));

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should receive only once
      expect(receiveCount).toBe(1);

      await vein.stop();
    });
  });

  describe('Batch Processing', () => {
    it('should process messages in batches', async () => {
      const vein = new Vein('test-stream', {
        batchSize: 3,
      });

      const batches: BloodCell[][] = [];

      await vein.start();

      vein.onBatch((cells) => {
        batches.push(cells);
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));
      await vein.receive(new BloodCell({ data: 3 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(3);

      await vein.stop();
    });

    it('should flush batch on timeout', async () => {
      const vein = new Vein('test-stream', {
        batchSize: 10,
        batchTimeout: 100,
      });

      const batches: BloodCell[][] = [];

      await vein.start();

      vein.onBatch((cells) => {
        batches.push(cells);
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(2);

      await vein.stop();
    });

    it('should acknowledge entire batch', async () => {
      const vein = new Vein('test-stream', {
        batchSize: 3,
        autoAck: false,
      });

      const acks: string[] = [];

      await vein.start();

      vein.onAcknowledge((cell) => {
        acks.push(cell.id);
      });

      vein.onBatch(async (cells) => {
        await vein.acknowledgeBatch(cells);
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));
      await vein.receive(new BloodCell({ data: 3 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(acks).toHaveLength(3);

      await vein.stop();
    });
  });

  describe('Pull-based Consumption', () => {
    it('should support pull-based consumption', async () => {
      const vein = new Vein('test-stream', {
        pullMode: true,
      });

      await vein.start();

      // Add messages to buffer
      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));

      // Pull messages
      const msg1 = await vein.pull();
      const msg2 = await vein.pull();

      expect(msg1?.payload.data).toBe(1);
      expect(msg2?.payload.data).toBe(2);

      await vein.stop();
    });

    it('should return null when buffer is empty', async () => {
      const vein = new Vein('test-stream', {
        pullMode: true,
      });

      await vein.start();

      const msg = await vein.pull();
      expect(msg).toBeNull();

      await vein.stop();
    });

    it('should pull batch of messages', async () => {
      const vein = new Vein('test-stream', {
        pullMode: true,
      });

      await vein.start();

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));
      await vein.receive(new BloodCell({ data: 3 }));

      const batch = await vein.pullBatch(2);

      expect(batch).toHaveLength(2);
      expect(batch[0].payload.data).toBe(1);
      expect(batch[1].payload.data).toBe(2);

      await vein.stop();
    });
  });

  describe('Buffering', () => {
    it('should buffer incoming messages', async () => {
      const vein = new Vein('test-stream', {
        maxBufferSize: 10,
      });

      await vein.start();

      for (let i = 0; i < 5; i++) {
        await vein.receive(new BloodCell({ data: i }));
      }

      expect(vein.getBufferSize()).toBe(5);

      await vein.stop();
    });

    it('should reject messages when buffer is full', async () => {
      const vein = new Vein('test-stream', {
        maxBufferSize: 2,
      });

      await vein.start();

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));

      await expect(vein.receive(new BloodCell({ data: 3 }))).rejects.toThrow('Buffer full');

      await vein.stop();
    });

    it('should emit buffer full event', async () => {
      const vein = new Vein('test-stream', {
        maxBufferSize: 2,
      });

      const events: number[] = [];

      await vein.start();

      vein.onBufferFull((size) => {
        events.push(size);
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));

      try {
        await vein.receive(new BloodCell({ data: 3 }));
      } catch {
        // Expected
      }

      expect(events.length).toBeGreaterThan(0);

      await vein.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors', async () => {
      const vein = new Vein('test-stream');
      const errors: Error[] = [];

      await vein.start();

      vein.onError((error) => {
        errors.push(error);
      });

      vein.onMessage(() => {
        throw new Error('Processing failed');
      });

      await vein.receive(new BloodCell({ data: 'test' }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(errors.length).toBeGreaterThan(0);

      await vein.stop();
    });

    it('should continue processing after error', async () => {
      const vein = new Vein('test-stream');
      const received: BloodCell[] = [];
      let errorCount = 0;

      await vein.start();

      vein.onError(() => {
        errorCount++;
      });

      vein.onMessage((cell) => {
        if (cell.payload.data === 2) {
          throw new Error('Failed on 2');
        }
        received.push(cell);
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));
      await vein.receive(new BloodCell({ data: 3 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(errorCount).toBe(1);
      expect(received).toHaveLength(2);

      await vein.stop();
    });
  });

  describe('Consumer Groups', () => {
    it('should support multiple consumers', async () => {
      const vein = new Vein('test-stream');
      const received1: BloodCell[] = [];
      const received2: BloodCell[] = [];

      await vein.start();

      vein.onMessage((cell) => {
        received1.push(cell);
      });

      vein.onMessage((cell) => {
        received2.push(cell);
      });

      await vein.receive(new BloodCell({ data: 'test' }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Both consumers should receive
      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);

      await vein.stop();
    });

    it('should support consumer removal', async () => {
      const vein = new Vein('test-stream');
      const received: BloodCell[] = [];

      await vein.start();

      const unsubscribe = vein.onMessage((cell) => {
        received.push(cell);
      });

      await vein.receive(new BloodCell({ data: 1 }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      unsubscribe();

      await vein.receive(new BloodCell({ data: 2 }));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(received).toHaveLength(1);

      await vein.stop();
    });
  });

  describe('Statistics', () => {
    it('should track stream statistics', async () => {
      const vein = new Vein('test-stream');

      await vein.start();

      vein.onMessage(() => {});

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));
      await vein.receive(new BloodCell({ data: 3 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = vein.getStats();
      expect(stats.received).toBeGreaterThanOrEqual(3);
      expect(stats.processed).toBeGreaterThanOrEqual(3);

      await vein.stop();
    });

    it('should track acknowledgments', async () => {
      const vein = new Vein('test-stream');

      await vein.start();

      vein.onMessage((cell) => {
        cell.acknowledge();
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = vein.getStats();
      expect(stats.acknowledged).toBeGreaterThanOrEqual(2);

      await vein.stop();
    });

    it('should track error count', async () => {
      const vein = new Vein('test-stream');

      await vein.start();

      vein.onError(() => {});

      vein.onMessage(() => {
        throw new Error('Test error');
      });

      await vein.receive(new BloodCell({ data: 1 }));
      await vein.receive(new BloodCell({ data: 2 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = vein.getStats();
      expect(stats.errors).toBeGreaterThanOrEqual(2);

      await vein.stop();
    });
  });

  describe('Message Ordering', () => {
    it('should maintain message order', async () => {
      const vein = new Vein('test-stream');
      const received: number[] = [];

      await vein.start();

      vein.onMessage((cell) => {
        received.push(cell.payload.data);
      });

      for (let i = 1; i <= 10; i++) {
        await vein.receive(new BloodCell({ data: i }));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(received).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      await vein.stop();
    });

    it('should support priority ordering', async () => {
      const vein = new Vein('test-stream', {
        priorityMode: true,
      });

      const received: number[] = [];

      await vein.start();

      vein.onMessage((cell) => {
        received.push(cell.payload.data);
      });

      await vein.receive(new BloodCell({ data: 1 }, { priority: 0 }));
      await vein.receive(new BloodCell({ data: 2 }, { priority: 10 }));
      await vein.receive(new BloodCell({ data: 3 }, { priority: 5 }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should process in priority order: 2, 3, 1
      expect(received).toEqual([2, 3, 1]);

      await vein.stop();
    });
  });
});
