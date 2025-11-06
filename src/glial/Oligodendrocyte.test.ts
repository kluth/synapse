import { Oligodendrocyte } from './Oligodendrocyte';

describe('Oligodendrocyte - Performance Optimization', () => {
  let oligodendrocyte: Oligodendrocyte;

  beforeEach(() => {
    oligodendrocyte = new Oligodendrocyte({
      id: 'oligo-1',
      maxConnections: 10,
      connectionTTL: 5000,
    });
  });

  afterEach(async () => {
    await oligodendrocyte.shutdown();
  });

  describe('initialization', () => {
    it('should create an oligodendrocyte with correct properties', () => {
      expect(oligodendrocyte.id).toBe('oligo-1');
      expect(oligodendrocyte.isActive).toBe(false);
    });

    it('should activate successfully', async () => {
      await oligodendrocyte.activate();

      expect(oligodendrocyte.isActive).toBe(true);
    });
  });

  describe('connection pooling', () => {
    beforeEach(async () => {
      await oligodendrocyte.activate();
    });

    it('should acquire connection from pool', async () => {
      const factory = jest.fn().mockResolvedValue({ id: 'conn-1' });

      const connection = await oligodendrocyte.acquire('db', factory);

      expect(connection).toEqual({ id: 'conn-1' });
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should reuse existing connections', async () => {
      const factory = jest
        .fn()
        .mockResolvedValueOnce({ id: 'conn-1' })
        .mockResolvedValueOnce({ id: 'conn-2' });

      const conn1 = await oligodendrocyte.acquire('db', factory);
      await oligodendrocyte.release('db', conn1);

      const conn2 = await oligodendrocyte.acquire('db', factory);

      expect(conn1).toBe(conn2);
      expect(factory).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should respect max connections limit', async () => {
      const limitedOligo = new Oligodendrocyte({
        id: 'oligo-2',
        maxConnections: 2,
      });

      await limitedOligo.activate();

      const factory = jest
        .fn()
        .mockResolvedValueOnce({ id: 'conn-1' })
        .mockResolvedValueOnce({ id: 'conn-2' })
        .mockResolvedValueOnce({ id: 'conn-3' });

      await limitedOligo.acquire('db', factory);
      await limitedOligo.acquire('db', factory);

      const stats = limitedOligo.getStats();
      expect(stats.activeConnections).toBe(2);

      await limitedOligo.shutdown();
    });

    it('should handle connection expiration', async () => {
      const shortTTLOligo = new Oligodendrocyte({
        id: 'oligo-3',
        maxConnections: 10,
        connectionTTL: 50, // 50ms
      });

      await shortTTLOligo.activate();

      const factory = jest
        .fn()
        .mockResolvedValueOnce({ id: 'conn-1' })
        .mockResolvedValueOnce({ id: 'conn-2' });

      const conn1 = await shortTTLOligo.acquire('db', factory);
      await shortTTLOligo.release('db', conn1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should create new connection (old one expired)
      await shortTTLOligo.acquire('db', factory);

      expect(factory).toHaveBeenCalledTimes(2);

      await shortTTLOligo.shutdown();
    });
  });

  describe('resource caching', () => {
    beforeEach(async () => {
      await oligodendrocyte.activate();
    });

    it('should cache computed resources', async () => {
      const compute = jest.fn().mockResolvedValue('result-1');

      const result1 = await oligodendrocyte.memoize('expensive-op', compute);
      const result2 = await oligodendrocyte.memoize('expensive-op', compute);

      expect(result1).toBe('result-1');
      expect(result2).toBe('result-1');
      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('should cache with TTL', async () => {
      const compute = jest.fn().mockResolvedValueOnce('result-1').mockResolvedValueOnce('result-2');

      await oligodendrocyte.memoize('op', compute, { ttl: 50 });

      // Wait for cache expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      await oligodendrocyte.memoize('op', compute, { ttl: 50 });

      expect(compute).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cached resources', async () => {
      const compute = jest.fn().mockResolvedValueOnce('result-1').mockResolvedValueOnce('result-2');

      await oligodendrocyte.memoize('op', compute);
      await oligodendrocyte.invalidate('op');
      await oligodendrocyte.memoize('op', compute);

      expect(compute).toHaveBeenCalledTimes(2);
    });
  });

  describe('myelination tracking', () => {
    beforeEach(async () => {
      await oligodendrocyte.activate();
    });

    it('should track myelinated paths', async () => {
      const factory = jest.fn().mockResolvedValue({ id: 'conn-1' });

      await oligodendrocyte.acquire('db', factory);
      await oligodendrocyte.acquire('cache', factory);

      const paths = oligodendrocyte.getMyelinatedPaths();

      expect(paths).toContain('db');
      expect(paths).toContain('cache');
    });

    it('should provide myelination statistics', async () => {
      const factory = jest.fn().mockResolvedValue({ id: 'conn-1' });
      const compute = jest.fn().mockResolvedValue('result');

      await oligodendrocyte.acquire('db', factory);
      await oligodendrocyte.memoize('op1', compute);
      await oligodendrocyte.memoize('op2', compute);

      const stats = oligodendrocyte.getStats();

      expect(stats.myelinatedPaths).toBe(1); // 'db'
      expect(stats.cachedOperations).toBe(2); // 'op1', 'op2'
    });
  });

  describe('performance optimization', () => {
    beforeEach(async () => {
      await oligodendrocyte.activate();
    });

    it('should improve repeated operation performance', async () => {
      let callCount = 0;
      const slowOperation = async (): Promise<number> => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 42;
      };

      const start1 = Date.now();
      await oligodendrocyte.memoize('slow-op', slowOperation);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      await oligodendrocyte.memoize('slow-op', slowOperation);
      const duration2 = Date.now() - start2;

      expect(callCount).toBe(1);
      expect(duration2).toBeLessThan(duration1);
    });

    it('should track performance metrics', async () => {
      const compute = jest.fn().mockResolvedValue('result');

      await oligodendrocyte.memoize('op', compute);
      await oligodendrocyte.memoize('op', compute);
      await oligodendrocyte.memoize('op', compute);

      const stats = oligodendrocyte.getStats();

      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.67, 1);
    });
  });

  describe('lifecycle management', () => {
    it('should clean up resources on shutdown', async () => {
      await oligodendrocyte.activate();

      const factory = jest.fn().mockResolvedValue({ id: 'conn-1' });
      await oligodendrocyte.acquire('db', factory);

      const compute = jest.fn().mockResolvedValue('result');
      await oligodendrocyte.memoize('op', compute);

      await oligodendrocyte.shutdown();

      const stats = oligodendrocyte.getStats();

      expect(stats.activeConnections).toBe(0);
      expect(stats.cachedOperations).toBe(0);
    });

    it('should throw error when operations called while inactive', async () => {
      const factory = jest.fn().mockResolvedValue({ id: 'conn-1' });

      await expect(oligodendrocyte.acquire('db', factory)).rejects.toThrow(
        'Oligodendrocyte is not active',
      );
    });
  });
});
