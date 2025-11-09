import { CacheResource, type CacheClient } from '../resources/CacheResource';

// Mock cache client
class MockCacheClient implements CacheClient {
  private store = new Map<string, { value: unknown; expiry?: number }>();
  private isOpen = true;

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.isOpen) throw new Error('Client closed');
    const entry = this.store.get(key);
    if (entry === undefined) return null;
    if (entry.expiry !== undefined && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.isOpen) throw new Error('Client closed');
    if (ttl !== undefined) {
      this.store.set(key, {
        value,
        expiry: Date.now() + ttl * 1000,
      });
    } else {
      this.store.set(key, {
        value,
      });
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isOpen) throw new Error('Client closed');
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isOpen) throw new Error('Client closed');
    return this.store.has(key);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isOpen) throw new Error('Client closed');
    const entry = this.store.get(key);
    if (entry === undefined) return false;
    entry.expiry = Date.now() + ttl * 1000;
    return true;
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isOpen) throw new Error('Client closed');
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  async clear(): Promise<void> {
    if (!this.isOpen) throw new Error('Client closed');
    this.store.clear();
  }

  async mget<T = unknown>(keys: string[]): Promise<Array<T | null>> {
    if (!this.isOpen) throw new Error('Client closed');
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    if (!this.isOpen) throw new Error('Client closed');
    await Promise.all(entries.map((e) => this.set(e.key, e.value, e.ttl)));
  }

  async ping(): Promise<boolean> {
    return this.isOpen;
  }

  async close(): Promise<void> {
    this.isOpen = false;
    this.store.clear();
  }
}

describe('CacheResource', () => {
  describe('Connection Management', () => {
    it('should connect to cache', async () => {
      const cache = new CacheResource({
        name: 'TestCache',
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      expect(cache.isConnected()).toBe(true);
      expect(cache.getState()).toBe('connected');

      await cache.disconnect();
    });

    it('should disconnect from cache', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();
      await cache.disconnect();

      expect(cache.isConnected()).toBe(false);
    });
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('key1', 'value1');
      const value = await cache.get<string>('key1');

      expect(value).toBe('value1');

      await cache.disconnect();
    });

    it('should delete values', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('key1', 'value1');
      const deleted = await cache.delete('key1');
      const value = await cache.get('key1');

      expect(deleted).toBe(true);
      expect(value).toBeNull();

      await cache.disconnect();
    });

    it('should check if key exists', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('key1', 'value1');

      expect(await cache.exists('key1')).toBe(true);
      expect(await cache.exists('key2')).toBe(false);

      await cache.disconnect();
    });
  });

  describe('TTL Management', () => {
    it('should set value with TTL', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
        defaultTTL: 60,
      });

      await cache.connect();

      await cache.set('key1', 'value1', 1);

      let value = await cache.get('key1');
      expect(value).toBe('value1');

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1100));

      value = await cache.get('key1');
      expect(value).toBeNull();

      await cache.disconnect();
    });

    it('should set expiration time', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('key1', 'value1');
      const updated = await cache.expire('key1', 1);

      expect(updated).toBe(true);

      await cache.disconnect();
    });
  });

  describe('Key Prefix', () => {
    it('should use key prefix', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
        keyPrefix: 'app',
      });

      await cache.connect();

      await cache.set('user:1', { name: 'John' });
      const value = await cache.get('user:1');

      expect(value).toEqual({ name: 'John' });

      // Keys should include prefix internally
      const keys = await cache.keys('user:*');
      expect(keys).toContain('user:1');

      await cache.disconnect();
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const values = await cache.mget<string>(['key1', 'key2', 'key3']);

      expect(values).toEqual(['value1', 'value2', null]);

      await cache.disconnect();
    });

    it('should set multiple values', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.mset([
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ]);

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');

      await cache.disconnect();
    });
  });

  describe('Key Management', () => {
    it('should list keys by pattern', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('user:1', 'John');
      await cache.set('user:2', 'Jane');
      await cache.set('post:1', 'Post');

      const userKeys = await cache.keys('user:*');

      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');

      await cache.disconnect();
    });

    it('should clear all keys', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');

      expect(value1).toBeNull();
      expect(value2).toBeNull();

      await cache.disconnect();
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      const health = await cache.healthCheck();

      expect(health).toBe('healthy');

      await cache.disconnect();
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await cache.connect();

      await cache.set('key1', 'value1');
      await cache.get('key1');
      await cache.delete('key1');

      const stats = cache.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.failedRequests).toBe(0);

      await cache.disconnect();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not connected', async () => {
      const cache = new CacheResource({
        clientFactory: async () => new MockCacheClient(),
      });

      await expect(cache.get('key1')).rejects.toThrow('Cache not connected');
    });
  });
});
