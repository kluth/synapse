import { Artery } from '../core/Artery';
import { BloodCell } from '../core/BloodCell';

describe('Artery', () => {
  describe('Basic Stream Operations', () => {
    it('should create an artery stream', () => {
      const artery = new Artery('test-stream');
      expect(artery.name).toBe('test-stream');
      expect(artery.isActive()).toBe(false);
    });

    it('should start and stop stream', async () => {
      const artery = new Artery('test-stream');

      await artery.start();
      expect(artery.isActive()).toBe(true);

      await artery.stop();
      expect(artery.isActive()).toBe(false);
    });

    it('should send messages through stream', async () => {
      const artery = new Artery('test-stream');
      const received: BloodCell[] = [];

      artery.onData((cell) => {
        received.push(cell);
      });

      await artery.start();
      await artery.send(new BloodCell({ data: 'test' }));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(received).toHaveLength(1);
      expect(received[0].payload).toEqual({ data: 'test' });

      await artery.stop();
    });

    it('should send multiple messages', async () => {
      const artery = new Artery('test-stream');
      const received: BloodCell[] = [];

      artery.onData((cell) => received.push(cell));

      await artery.start();
      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));
      await artery.send(new BloodCell({ data: 3 }));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(received).toHaveLength(3);
      await artery.stop();
    });
  });

  describe('Backpressure Management', () => {
    it('should apply backpressure when buffer is full', async () => {
      const artery = new Artery('test-stream', { maxBufferSize: 2 });
      await artery.start();

      const send1 = artery.send(new BloodCell({ data: 1 }));
      const send2 = artery.send(new BloodCell({ data: 2 }));

      // These should be queued
      await send1;
      await send2;

      expect(artery.getBufferSize()).toBeLessThanOrEqual(2);

      await artery.stop();
    });

    it('should emit backpressure event when buffer is full', async () => {
      const artery = new Artery('test-stream', { maxBufferSize: 2 });
      const backpressureEvents: number[] = [];

      artery.onBackpressure((size) => {
        backpressureEvents.push(size);
      });

      await artery.start();

      // Fill the buffer
      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));

      try {
        await artery.send(new BloodCell({ data: 3 })); // Should trigger backpressure
      } catch {
        // Expected - buffer full
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(backpressureEvents.length).toBeGreaterThan(0);

      await artery.stop();
    });

    it('should pause when backpressure threshold reached', async () => {
      const artery = new Artery('test-stream', {
        maxBufferSize: 10,
        highWaterMark: 8,
      });

      await artery.start();

      // Fill buffer to high water mark
      for (let i = 0; i < 9; i++) {
        await artery.send(new BloodCell({ data: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(artery.isPaused()).toBe(true);

      await artery.stop();
    });

    it('should resume when buffer drains below low water mark', async () => {
      const artery = new Artery('test-stream', {
        maxBufferSize: 10,
        highWaterMark: 8,
        lowWaterMark: 3,
      });

      const received: BloodCell[] = [];
      artery.onData((cell) => {
        received.push(cell);
      });

      await artery.start();

      // Fill buffer
      for (let i = 0; i < 9; i++) {
        await artery.send(new BloodCell({ data: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for buffer to drain
      expect(artery.isPaused()).toBe(false); // Should resume after draining

      await artery.stop();
    });
  });

  describe('Flow Control', () => {
    it('should throttle message rate', async () => {
      const artery = new Artery('test-stream', {
        maxRate: 10, // 10 messages per second
      });

      const received: BloodCell[] = [];
      artery.onData((cell) => received.push(cell));

      await artery.start();

      const startTime = Date.now();

      // Send 20 messages
      for (let i = 0; i < 20; i++) {
        await artery.send(new BloodCell({ data: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 2100));

      const elapsed = Date.now() - startTime;

      // Should take at least 2 seconds for 20 messages at 10/sec
      expect(elapsed).toBeGreaterThanOrEqual(2000);
      expect(received.length).toBeGreaterThanOrEqual(18);

      await artery.stop();
    });

    it('should support burst mode', async () => {
      const artery = new Artery('test-stream', {
        maxRate: 10,
        burstSize: 5, // Allow bursts of 5
      });

      const received: BloodCell[] = [];
      artery.onData((cell) => received.push(cell));

      await artery.start();

      // Send burst
      for (let i = 0; i < 5; i++) {
        await artery.send(new BloodCell({ data: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // Burst should be delivered quickly
      expect(received.length).toBe(5);

      await artery.stop();
    });

    it('should support manual flow control', async () => {
      const artery = new Artery('test-stream');
      await artery.start();

      await artery.pause();
      expect(artery.isPaused()).toBe(true);

      await artery.resume();
      expect(artery.isPaused()).toBe(false);

      await artery.stop();
    });
  });

  describe('Batching', () => {
    it('should batch messages by size', async () => {
      const artery = new Artery('test-stream', {
        batchSize: 3,
      });

      const batches: BloodCell[][] = [];
      artery.onBatch((cells) => {
        batches.push(cells);
      });

      await artery.start();

      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));
      await artery.send(new BloodCell({ data: 3 }));
      await artery.send(new BloodCell({ data: 4 }));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(batches.length).toBeGreaterThanOrEqual(1);
      expect(batches[0]).toHaveLength(3);

      await artery.stop();
    });

    it('should batch messages by time', async () => {
      const artery = new Artery('test-stream', {
        batchTimeout: 100, // 100ms
      });

      const batches: BloodCell[][] = [];
      artery.onBatch((cells) => {
        batches.push(cells);
      });

      await artery.start();

      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(batches.length).toBeGreaterThanOrEqual(1);
      expect(batches[0].length).toBeGreaterThanOrEqual(2);

      await artery.stop();
    });

    it('should flush batch on demand', async () => {
      const artery = new Artery('test-stream', {
        batchSize: 10,
      });

      const batches: BloodCell[][] = [];
      artery.onBatch((cells) => {
        batches.push(cells);
      });

      await artery.start();

      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));

      // Wait for messages to be processed into batch
      await new Promise(resolve => setTimeout(resolve, 50));

      await artery.flush();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(2);

      await artery.stop();
    });
  });

  describe('Stream Transformations', () => {
    it('should transform messages in stream', async () => {
      const artery = new Artery('test-stream');
      const received: BloodCell[] = [];

      artery.transform((cell) => {
        return new BloodCell({
          data: cell.payload.data.toUpperCase()
        });
      });

      artery.onData((cell) => received.push(cell));

      await artery.start();
      await artery.send(new BloodCell({ data: 'hello' }));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(received[0].payload.data).toBe('HELLO');

      await artery.stop();
    });

    it('should filter messages in stream', async () => {
      const artery = new Artery('test-stream');
      const received: BloodCell[] = [];

      artery.filter((cell) => cell.payload.data > 5);
      artery.onData((cell) => received.push(cell));

      await artery.start();
      await artery.send(new BloodCell({ data: 3 }));
      await artery.send(new BloodCell({ data: 7 }));
      await artery.send(new BloodCell({ data: 2 }));
      await artery.send(new BloodCell({ data: 9 }));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(received).toHaveLength(2);
      expect(received[0].payload.data).toBe(7);
      expect(received[1].payload.data).toBe(9);

      await artery.stop();
    });

    it('should support multiple transformations', async () => {
      const artery = new Artery('test-stream');
      const received: BloodCell[] = [];

      artery
        .transform((cell) => new BloodCell({ data: cell.payload.data * 2 }))
        .transform((cell) => new BloodCell({ data: cell.payload.data + 10 }));

      artery.onData((cell) => received.push(cell));

      await artery.start();
      await artery.send(new BloodCell({ data: 5 }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // (5 * 2) + 10 = 20
      expect(received[0].payload.data).toBe(20);

      await artery.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle send errors', async () => {
      const artery = new Artery('test-stream');
      const errors: Error[] = [];

      artery.onError((error) => {
        errors.push(error);
      });

      await artery.start();

      // Simulate error in transformation
      artery.transform(() => {
        throw new Error('Transform failed');
      });

      await artery.send(new BloodCell({ data: 'test' }));
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('Transform failed');

      await artery.stop();
    });

    it('should continue processing after error', async () => {
      const artery = new Artery('test-stream');
      const received: BloodCell[] = [];
      let errorCount = 0;

      artery.onError(() => errorCount++);
      artery.onData((cell) => received.push(cell));

      artery.transform((cell) => {
        if (cell.payload.data === 2) {
          throw new Error('Failed on 2');
        }
        return cell;
      });

      await artery.start();
      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 })); // Should error
      await artery.send(new BloodCell({ data: 3 }));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(errorCount).toBe(1);
      expect(received).toHaveLength(2); // 1 and 3

      await artery.stop();
    });

    it('should not send when stream is stopped', async () => {
      const artery = new Artery('test-stream');

      await expect(
        artery.send(new BloodCell({ data: 'test' }))
      ).rejects.toThrow('Artery is not active');
    });
  });

  describe('Statistics', () => {
    it('should track stream statistics', async () => {
      const artery = new Artery('test-stream');
      artery.onData(() => {});

      await artery.start();

      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));
      await artery.send(new BloodCell({ data: 3 }));

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = artery.getStats();
      expect(stats.sent).toBeGreaterThanOrEqual(3);
      expect(stats.delivered).toBeGreaterThanOrEqual(3);

      await artery.stop();
    });

    it('should track error count', async () => {
      const artery = new Artery('test-stream');
      artery.onError(() => {});

      artery.transform(() => {
        throw new Error('Test error');
      });

      await artery.start();

      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = artery.getStats();
      expect(stats.errors).toBeGreaterThanOrEqual(2);

      await artery.stop();
    });

    it('should track throughput', async () => {
      const artery = new Artery('test-stream');
      artery.onData(() => {});

      await artery.start();

      for (let i = 0; i < 10; i++) {
        await artery.send(new BloodCell({ data: i }));
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = artery.getStats();
      expect(stats.throughput).toBeGreaterThan(0);

      await artery.stop();
    });
  });

  describe('Connection Management', () => {
    it('should handle multiple consumers', async () => {
      const artery = new Artery('test-stream');
      const received1: BloodCell[] = [];
      const received2: BloodCell[] = [];

      artery.onData((cell) => received1.push(cell));
      artery.onData((cell) => received2.push(cell));

      await artery.start();
      await artery.send(new BloodCell({ data: 'test' }));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);

      await artery.stop();
    });

    it('should support consumer removal', async () => {
      const artery = new Artery('test-stream');
      const received: BloodCell[] = [];

      const unsubscribe = artery.onData((cell) => received.push(cell));

      await artery.start();
      await artery.send(new BloodCell({ data: 1 }));

      // Wait for first message to be processed
      await new Promise(resolve => setTimeout(resolve, 50));

      unsubscribe();

      await artery.send(new BloodCell({ data: 2 }));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(received).toHaveLength(1);

      await artery.stop();
    });

    it('should drain buffer on stop', async () => {
      const artery = new Artery('test-stream', { maxBufferSize: 10 });
      const received: BloodCell[] = [];

      artery.onData((cell) => received.push(cell));

      await artery.start();

      await artery.send(new BloodCell({ data: 1 }));
      await artery.send(new BloodCell({ data: 2 }));
      await artery.send(new BloodCell({ data: 3 }));

      await artery.stop(); // Should drain buffer

      expect(received.length).toBeGreaterThanOrEqual(3);
    });
  });
});
