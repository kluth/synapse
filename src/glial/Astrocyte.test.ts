import { Astrocyte } from './Astrocyte';

describe('Astrocyte - State Management System', () => {
  let astrocyte: Astrocyte;

  beforeEach(() => {
    astrocyte = new Astrocyte({
      id: 'astro-1',
      cacheSize: 100,
      ttl: 1000, // 1 second
    });
  });

  afterEach(async () => {
    await astrocyte.shutdown();
  });

  describe('initialization', () => {
    it('should create an astrocyte with correct properties', () => {
      expect(astrocyte.id).toBe('astro-1');
      expect(astrocyte.isActive).toBe(false);
    });

    it('should activate successfully', async () => {
      await astrocyte.activate();
      expect(astrocyte.isActive).toBe(true);
    });
  });

  describe('working memory (in-process)', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should store and retrieve values', async () => {
      await astrocyte.set('user:123', { name: 'Alice', age: 30 });
      const value = await astrocyte.get<{ name: string; age: number }>('user:123');

      expect(value).toEqual({ name: 'Alice', age: 30 });
    });

    it('should return undefined for non-existent keys', async () => {
      const value = await astrocyte.get('non-existent');
      expect(value).toBeUndefined();
    });

    it('should delete values', async () => {
      await astrocyte.set('temp', 'value');
      await astrocyte.delete('temp');

      const value = await astrocyte.get('temp');
      expect(value).toBeUndefined();
    });

    it('should check if key exists', async () => {
      await astrocyte.set('exists', 'yes');

      expect(await astrocyte.has('exists')).toBe(true);
      expect(await astrocyte.has('not-exists')).toBe(false);
    });

    it('should clear all values', async () => {
      await astrocyte.set('key1', 'value1');
      await astrocyte.set('key2', 'value2');
      await astrocyte.set('key3', 'value3');

      await astrocyte.clear();

      expect(await astrocyte.get('key1')).toBeUndefined();
      expect(await astrocyte.get('key2')).toBeUndefined();
      expect(await astrocyte.get('key3')).toBeUndefined();
    });
  });

  describe('TTL (Time-To-Live)', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should expire values after TTL', async () => {
      await astrocyte.set('expiring', 'value', { ttl: 50 });

      // Should exist immediately
      expect(await astrocyte.get('expiring')).toBe('value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should be expired
      expect(await astrocyte.get('expiring')).toBeUndefined();
    });

    it('should not expire values without TTL', async () => {
      await astrocyte.set('permanent', 'value');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(await astrocyte.get('permanent')).toBe('value');
    });

    it('should use default TTL when specified', async () => {
      const shortTtlAstro = new Astrocyte({
        id: 'short-ttl',
        cacheSize: 100,
        ttl: 50,
      });

      await shortTtlAstro.activate();
      await shortTtlAstro.set('auto-expire', 'value');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(await shortTtlAstro.get('auto-expire')).toBeUndefined();
      await shortTtlAstro.shutdown();
    });
  });

  describe('LRU cache eviction', () => {
    beforeEach(async () => {
      const smallCache = new Astrocyte({
        id: 'small-cache',
        cacheSize: 3,
      });
      await smallCache.activate();
      astrocyte = smallCache;
    });

    it('should evict least recently used items when cache is full', async () => {
      await astrocyte.set('item1', 'value1');
      await astrocyte.set('item2', 'value2');
      await astrocyte.set('item3', 'value3');

      // Cache is now full. Adding item4 should evict item1
      await astrocyte.set('item4', 'value4');

      expect(await astrocyte.get('item1')).toBeUndefined();
      expect(await astrocyte.get('item2')).toBe('value2');
      expect(await astrocyte.get('item3')).toBe('value3');
      expect(await astrocyte.get('item4')).toBe('value4');
    });

    it('should update access order on get', async () => {
      await astrocyte.set('item1', 'value1');
      await astrocyte.set('item2', 'value2');
      await astrocyte.set('item3', 'value3');

      // Access item1 to make it recently used
      await astrocyte.get('item1');

      // Adding item4 should evict item2 (now least recently used)
      await astrocyte.set('item4', 'value4');

      expect(await astrocyte.get('item1')).toBe('value1');
      expect(await astrocyte.get('item2')).toBeUndefined();
      expect(await astrocyte.get('item3')).toBe('value3');
      expect(await astrocyte.get('item4')).toBe('value4');
    });
  });

  describe('state synchronization', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should provide snapshot of all state', async () => {
      await astrocyte.set('key1', 'value1');
      await astrocyte.set('key2', { nested: 'object' });
      await astrocyte.set('key3', 123);

      const snapshot = astrocyte.snapshot();

      expect(snapshot).toEqual({
        key1: 'value1',
        key2: { nested: 'object' },
        key3: 123,
      });
    });

    it('should restore from snapshot', async () => {
      const snapshot = {
        restored1: 'value1',
        restored2: { data: 'value2' },
      };

      await astrocyte.restore(snapshot);

      expect(await astrocyte.get('restored1')).toBe('value1');
      expect(await astrocyte.get('restored2')).toEqual({ data: 'value2' });
    });
  });

  describe('namespace support', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should support namespaced keys', async () => {
      await astrocyte.set('users:123:profile', { name: 'Alice' });
      await astrocyte.set('users:456:profile', { name: 'Bob' });
      await astrocyte.set('posts:789', { title: 'Hello' });

      expect(await astrocyte.get('users:123:profile')).toEqual({ name: 'Alice' });
      expect(await astrocyte.get('users:456:profile')).toEqual({ name: 'Bob' });
      expect(await astrocyte.get('posts:789')).toEqual({ title: 'Hello' });
    });

    it('should list keys by pattern', async () => {
      await astrocyte.set('users:1', 'user1');
      await astrocyte.set('users:2', 'user2');
      await astrocyte.set('posts:1', 'post1');

      const userKeys = astrocyte.keys('users:*');
      expect(userKeys).toContain('users:1');
      expect(userKeys).toContain('users:2');
      expect(userKeys).not.toContain('posts:1');
    });
  });

  describe('statistics and monitoring', () => {
    beforeEach(async () => {
      await astrocyte.activate();
    });

    it('should track cache hits and misses', async () => {
      await astrocyte.set('hit-key', 'value');

      // Hit
      await astrocyte.get('hit-key');

      // Miss
      await astrocyte.get('miss-key');

      const stats = astrocyte.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should calculate hit rate', async () => {
      await astrocyte.set('key1', 'value1');
      await astrocyte.set('key2', 'value2');

      // 2 hits
      await astrocyte.get('key1');
      await astrocyte.get('key2');

      // 1 miss
      await astrocyte.get('key3');

      const stats = astrocyte.getStats();
      expect(stats.hitRate).toBeCloseTo(0.666, 2); // 2/3
    });
  });
});
