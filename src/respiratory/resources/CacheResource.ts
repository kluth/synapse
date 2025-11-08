/**
 * CacheResource - Cache Connection Manager
 *
 * Manages cache connections (Redis, Memcached, etc.) with:
 * - Get/Set/Delete operations
 * - TTL support
 * - Batch operations
 * - Connection pooling
 */

import { Resource, type ResourceConfig } from './Resource';

/**
 * Cache client interface
 */
export interface CacheClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  clear(): Promise<void>;
  mget<T = unknown>(keys: string[]): Promise<Array<T | null>>;
  mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

/**
 * Cache configuration
 */
export interface CacheConfig extends ResourceConfig {
  clientFactory: () => Promise<CacheClient>;
  defaultTTL?: number;
  keyPrefix?: string;
}

/**
 * Cache resource for managing cache connections
 */
export class CacheResource extends Resource {
  private client: CacheClient | null = null;
  private clientFactory: () => Promise<CacheClient>;
  private defaultTTL?: number;
  private keyPrefix: string;

  constructor(config: CacheConfig) {
    super(config);
    this.clientFactory = config.clientFactory;
    if (config.defaultTTL !== undefined) {
      this.defaultTTL = config.defaultTTL;
    }
    this.keyPrefix = config.keyPrefix ?? '';
  }

  public getType(): string {
    return 'Cache';
  }

  /**
   * Get a value from cache
   */
  public async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      const result = await this.client.get<T>(this.prefixKey(key));
      this.trackRequest(Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Set a value in cache
   */
  public async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      await this.client.set(this.prefixKey(key), value, ttl ?? this.defaultTTL);
      this.trackRequest(Date.now() - startTime, true);
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Delete a value from cache
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      const result = await this.client.delete(this.prefixKey(key));
      this.trackRequest(Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    return this.client.exists(this.prefixKey(key));
  }

  /**
   * Set expiration time
   */
  public async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    return this.client.expire(this.prefixKey(key), ttl);
  }

  /**
   * Get keys matching pattern
   */
  public async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    const keys = await this.client.keys(this.prefixKey(pattern));
    return keys.map((key) => this.unprefixKey(key));
  }

  /**
   * Clear all keys
   */
  public async clear(): Promise<void> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    await this.client.clear();
  }

  /**
   * Get multiple values
   */
  public async mget<T = unknown>(keys: string[]): Promise<Array<T | null>> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      const result = await this.client.mget<T>(keys.map((k) => this.prefixKey(k)));
      this.trackRequest(Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Set multiple values
   */
  public async mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<void> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Cache not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      await this.client.mset(
        entries.map((e) => {
          const ttl = e.ttl ?? this.defaultTTL;
          return {
            key: this.prefixKey(e.key),
            value: e.value,
            ...(ttl !== undefined && { ttl }),
          };
        }),
      );
      this.trackRequest(Date.now() - startTime, true);
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Connect to cache
   */
  protected async doConnect(): Promise<void> {
    this.client = await this.clientFactory();
  }

  /**
   * Disconnect from cache
   */
  protected async doDisconnect(): Promise<void> {
    if (this.client !== null) {
      await this.client.close();
      this.client = null;
    }
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<boolean> {
    if (this.client === null) {
      return false;
    }

    try {
      return await this.client.ping();
    } catch {
      return false;
    }
  }

  /**
   * Add prefix to key
   */
  private prefixKey(key: string): string {
    return this.keyPrefix !== '' ? `${this.keyPrefix}:${key}` : key;
  }

  /**
   * Remove prefix from key
   */
  private unprefixKey(key: string): string {
    if (this.keyPrefix !== '' && key.startsWith(`${this.keyPrefix}:`)) {
      return key.substring(this.keyPrefix.length + 1);
    }
    return key;
  }
}
