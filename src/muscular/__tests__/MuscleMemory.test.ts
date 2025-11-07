import { MuscleMemory } from '../core/MuscleMemory';

describe('MuscleMemory', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Caching', () => {
    it('should cache values by key', () => {
      const cache = new MuscleMemory<string>();

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      const cache = new MuscleMemory<string>();

      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      const cache = new MuscleMemory<string>();

      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete cached values', () => {
      const cache = new MuscleMemory<string>();

      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all cached values', () => {
      const cache = new MuscleMemory<string>();

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should track cache size', () => {
      const cache = new MuscleMemory<string>();

      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', () => {
      const cache = new MuscleMemory<string>({ ttl: 1000 });

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Advance time by 500ms - should still be valid
      jest.advanceTimersByTime(500);
      expect(cache.get('key1')).toBe('value1');

      // Advance time by another 600ms (total 1100ms) - should be expired
      jest.advanceTimersByTime(600);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should support per-entry TTL', () => {
      const cache = new MuscleMemory<string>({ ttl: 2000 });

      cache.set('key1', 'value1', { ttl: 500 });
      cache.set('key2', 'value2'); // Uses default 2000ms

      // After 600ms, key1 should be expired, key2 should still exist
      jest.advanceTimersByTime(600);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should not expire entries without TTL', () => {
      const cache = new MuscleMemory<string>();

      cache.set('key1', 'value1');

      // Advance time significantly
      jest.advanceTimersByTime(10000);
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('LRU (Least Recently Used) Eviction', () => {
    it('should evict least recently used entries when max size is reached', () => {
      const cache = new MuscleMemory<string>({ maxSize: 3 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);

      // Adding a 4th entry should evict key1 (least recently used)
      cache.set('key4', 'value4');
      expect(cache.size()).toBe(3);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update LRU order on get', () => {
      const cache = new MuscleMemory<string>({ maxSize: 3 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it recently used
      cache.get('key1');

      // Adding a 4th entry should evict key2 (now least recently used)
      cache.set('key4', 'value4');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update LRU order on set', () => {
      const cache = new MuscleMemory<string>({ maxSize: 3 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update key1 to make it recently used
      cache.set('key1', 'value1-updated');

      // Adding a 4th entry should evict key2
      cache.set('key4', 'value4');
      expect(cache.get('key1')).toBe('value1-updated');
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('Cache Invalidation Strategies', () => {
    it('should invalidate entries by pattern', () => {
      const cache = new MuscleMemory<string>();

      cache.set('user:1:profile', 'profile1');
      cache.set('user:1:posts', 'posts1');
      cache.set('user:2:profile', 'profile2');
      cache.set('product:1', 'product1');

      // Invalidate all user:1:* entries
      cache.invalidatePattern(/^user:1:/);

      expect(cache.has('user:1:profile')).toBe(false);
      expect(cache.has('user:1:posts')).toBe(false);
      expect(cache.has('user:2:profile')).toBe(true);
      expect(cache.has('product:1')).toBe(true);
    });

    it('should invalidate entries by tag', () => {
      const cache = new MuscleMemory<string>();

      cache.set('key1', 'value1', { tags: ['user', 'profile'] });
      cache.set('key2', 'value2', { tags: ['user', 'posts'] });
      cache.set('key3', 'value3', { tags: ['product'] });

      // Invalidate all entries tagged with 'user'
      cache.invalidateByTag('user');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });

    it('should invalidate entries by predicate', () => {
      const cache = new MuscleMemory<{ age: number }>();

      cache.set('person1', { age: 25 });
      cache.set('person2', { age: 35 });
      cache.set('person3', { age: 45 });

      // Invalidate all entries where age > 30
      cache.invalidateWhere((value) => value.age > 30);

      expect(cache.has('person1')).toBe(true);
      expect(cache.has('person2')).toBe(false);
      expect(cache.has('person3')).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', () => {
      const cache = new MuscleMemory<string>();

      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key3'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5); // 2/4 = 0.5
    });

    it('should track evictions', () => {
      const cache = new MuscleMemory<string>({ maxSize: 2 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // evicts key1

      const stats = cache.getStats();
      expect(stats.evictions).toBe(1);
    });
  });

  describe('Getters with Loaders', () => {
    it('should load value if not in cache', async () => {
      const cache = new MuscleMemory<string>();
      const loader = jest.fn(async (key: string) => `loaded-${key}`);

      const value = await cache.getOrLoad('key1', loader);

      expect(value).toBe('loaded-key1');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(cache.get('key1')).toBe('loaded-key1');
    });

    it('should not call loader if value is cached', async () => {
      const cache = new MuscleMemory<string>();
      const loader = jest.fn(async (key: string) => `loaded-${key}`);

      cache.set('key1', 'cached-value');
      const value = await cache.getOrLoad('key1', loader);

      expect(value).toBe('cached-value');
      expect(loader).not.toHaveBeenCalled();
    });

    it('should prevent cache stampede', async () => {
      const cache = new MuscleMemory<string>();
      let loaderCalls = 0;
      const loader = jest.fn(async (key: string) => {
        loaderCalls++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return `loaded-${key}`;
      });

      // Make 5 concurrent requests for the same key
      const promises = Array(5)
        .fill(null)
        .map(() => cache.getOrLoad('key1', loader));

      jest.runAllTimers();
      const results = await Promise.all(promises);

      // All should get the same value
      expect(results.every((r) => r === 'loaded-key1')).toBe(true);
      // Loader should only be called once (not 5 times)
      expect(loaderCalls).toBe(1);
    });
  });
});
