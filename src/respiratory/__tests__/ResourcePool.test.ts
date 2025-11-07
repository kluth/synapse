import { ResourcePool } from '../resources/ResourcePool';

describe('ResourcePool', () => {
  describe('Basic Operations', () => {
    it('should create and acquire resources', async () => {
      let created = 0;
      const pool = new ResourcePool<number>({
        factory: async () => {
          created++;
          return created;
        },
      });

      const resource1 = await pool.acquire();
      const resource2 = await pool.acquire();

      expect(resource1).toBe(1);
      expect(resource2).toBe(2);
      expect(created).toBe(2);

      await pool.release(resource1);
      await pool.release(resource2);
      await pool.drain();
    });

    it('should reuse released resources', async () => {
      let created = 0;
      const pool = new ResourcePool<number>({
        factory: async () => {
          created++;
          return created;
        },
      });

      const resource1 = await pool.acquire();
      await pool.release(resource1);

      const resource2 = await pool.acquire();

      expect(resource1).toBe(resource2);
      expect(created).toBe(1);

      await pool.release(resource2);
      await pool.drain();
    });
  });

  describe('Pool Limits', () => {
    it('should respect max pool size', async () => {
      const pool = new ResourcePool<number>({
        max: 2,
        factory: async () => Math.random(),
      });

      const r1 = await pool.acquire();
      const r2 = await pool.acquire();

      // Try to acquire third resource - should wait
      const acquirePromise = pool.acquire();

      // Release one resource
      await pool.release(r1);

      // Now the third acquire should succeed
      const r3 = await acquirePromise;
      expect(r3).toBe(r1);

      await pool.release(r2);
      await pool.release(r3);
      await pool.drain();
    });

    it('should timeout on acquire', async () => {
      const pool = new ResourcePool<number>({
        max: 1,
        acquireTimeout: 100,
        factory: async () => 1,
      });

      const r1 = await pool.acquire();

      // Try to acquire second - should timeout
      await expect(pool.acquire()).rejects.toThrow('Acquire timeout');

      await pool.release(r1);
      await pool.drain();
    });
  });

  describe('Resource Validation', () => {
    it('should validate resources before reuse', async () => {
      let createdCount = 0;
      const pool = new ResourcePool<number>({
        factory: async () => {
          createdCount++;
          return createdCount;
        },
        validator: async (resource) => resource === 2, // Only second resource is valid
      });

      const r1 = await pool.acquire();
      expect(r1).toBe(1);
      await pool.release(r1);

      // Second acquire should create new resource due to failed validation
      const r2 = await pool.acquire();
      expect(r2).toBe(2);
      expect(createdCount).toBe(2);

      await pool.release(r2);
      await pool.drain();
    });
  });

  describe('Idle Resource Cleanup', () => {
    it('should remove idle resources', async () => {
      const pool = new ResourcePool<number>({
        min: 0,
        max: 10,
        idleTimeout: 100,
        factory: async () => Math.random(),
      });

      const r1 = await pool.acquire();
      await pool.release(r1);

      let stats = pool.getStats();
      expect(stats.total).toBe(1);

      // Wait for idle timeout (idle check runs every idleTimeout/2 = 50ms, resource expires at 100ms)
      await new Promise((resolve) => setTimeout(resolve, 200));

      stats = pool.getStats();
      expect(stats.total).toBe(0);

      await pool.drain();
    });
  });

  describe('Statistics', () => {
    it('should track pool statistics', async () => {
      const pool = new ResourcePool<number>({
        factory: async () => Math.random(),
      });

      const r1 = await pool.acquire();
      const r2 = await pool.acquire();

      let stats = pool.getStats();
      expect(stats.total).toBe(2);
      expect(stats.inUse).toBe(2);
      expect(stats.available).toBe(0);
      expect(stats.created).toBe(2);

      await pool.release(r1);

      stats = pool.getStats();
      expect(stats.inUse).toBe(1);
      expect(stats.available).toBe(1);

      await pool.release(r2);
      await pool.drain();
    });
  });

  describe('Drain', () => {
    it('should drain pool and reject new requests', async () => {
      const pool = new ResourcePool<number>({
        factory: async () => Math.random(),
      });

      const r1 = await pool.acquire();
      await pool.release(r1);

      await pool.drain();

      await expect(pool.acquire()).rejects.toThrow('Pool is draining');
    });

    it('should wait for resources to be released before draining', async () => {
      const pool = new ResourcePool<number>({
        factory: async () => Math.random(),
      });

      const r1 = await pool.acquire();

      // Start drain (should wait for release)
      const drainPromise = pool.drain();

      // Release after delay
      setTimeout(() => {
        void pool.release(r1);
      }, 50);

      await drainPromise;

      const stats = pool.getStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('Events', () => {
    it('should emit resource events', async () => {
      const events: string[] = [];
      const pool = new ResourcePool<number>({
        factory: async () => Math.random(),
      });

      pool.on('resource:created', () => events.push('created'));
      pool.on('resource:acquired', () => events.push('acquired'));
      pool.on('resource:released', () => events.push('released'));
      pool.on('resource:destroyed', () => events.push('destroyed'));

      const r1 = await pool.acquire();
      await pool.release(r1);
      await pool.drain();

      expect(events).toContain('created');
      expect(events).toContain('acquired');
      expect(events).toContain('released');
      expect(events).toContain('destroyed');
    });
  });
});
