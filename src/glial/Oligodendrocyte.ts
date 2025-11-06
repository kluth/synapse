/**
 * Oligodendrocyte - Performance Optimization System
 *
 * Biological role: Oligodendrocytes wrap axons with myelin sheaths to speed up
 * signal transmission and provide metabolic support to neurons.
 *
 * Software mapping: Performance optimization layer that implements connection pooling,
 * resource caching, and memoization. Provides "myelination" for frequently-used
 * code paths through caching and pooling strategies.
 */

interface OligodendrocyteConfig {
  readonly id: string;
  readonly maxConnections?: number;
  readonly connectionTTL?: number; // Connection time-to-live in ms
}

interface PooledConnection<T = unknown> {
  resource: T;
  poolId: string;
  createdAt: number;
  lastUsed: number;
  inUse: boolean;
}

interface CachedResult<T = unknown> {
  value: T;
  computedAt: number;
  ttl?: number | undefined;
  hits: number;
}

interface MemoizeOptions {
  ttl?: number;
}

interface OligodendrocyteStats {
  activeConnections: number;
  availableConnections: number;
  myelinatedPaths: number;
  cachedOperations: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
}

type ConnectionFactory<T> = () => Promise<T>;
type ComputeFunction<T> = () => Promise<T>;

export class Oligodendrocyte {
  public readonly id: string;
  public isActive = false;

  private readonly maxConnections: number;
  private readonly connectionTTL?: number | undefined;

  // Connection pools by resource type
  private connectionPools: Map<string, Array<PooledConnection>> = new Map();

  // Memoization cache
  private computeCache: Map<string, CachedResult> = new Map();

  // Statistics
  private cacheHits = 0;
  private cacheMisses = 0;

  // Cleanup timer
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(config: OligodendrocyteConfig) {
    this.id = config.id;
    this.maxConnections = config.maxConnections ?? 100;
    this.connectionTTL = config.connectionTTL;
  }

  /**
   * LIFECYCLE MANAGEMENT
   */

  public async activate(): Promise<void> {
    if (this.isActive) {
      throw new Error('Oligodendrocyte is already active');
    }

    this.isActive = true;

    // Start periodic cleanup for expired connections and cache
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, 1000);

    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    this.isActive = false;

    if (this.cleanupTimer !== undefined) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Clear all connection pools
    this.connectionPools.clear();

    // Clear memoization cache
    this.computeCache.clear();

    return Promise.resolve();
  }

  /**
   * CONNECTION POOLING (Myelination)
   */

  public async acquire<T = unknown>(poolId: string, factory: ConnectionFactory<T>): Promise<T> {
    this.ensureActive();

    let pool = this.connectionPools.get(poolId);

    if (pool === undefined) {
      pool = [];
      this.connectionPools.set(poolId, pool);
    }

    // Try to find available connection
    const available = pool.find((conn) => !conn.inUse && !this.isConnectionExpired(conn));

    if (available !== undefined) {
      available.inUse = true;
      available.lastUsed = Date.now();
      return available.resource as T;
    }

    // Check if we can create new connection
    const totalConnections = this.getTotalConnectionCount();

    if (totalConnections >= this.maxConnections) {
      throw new Error('Connection pool limit reached');
    }

    // Create new connection
    const resource = await factory();
    const connection: PooledConnection<T> = {
      resource,
      poolId,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      inUse: true,
    };

    pool.push(connection);

    return resource;
  }

  public async release<T = unknown>(poolId: string, resource: T): Promise<void> {
    this.ensureActive();

    const pool = this.connectionPools.get(poolId);

    if (pool === undefined) {
      return;
    }

    const connection = pool.find((conn) => conn.resource === resource);

    if (connection !== undefined) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }

    return Promise.resolve();
  }

  /**
   * RESOURCE CACHING (Memoization)
   */

  public async memoize<T = unknown>(
    key: string,
    compute: ComputeFunction<T>,
    options?: MemoizeOptions,
  ): Promise<T> {
    this.ensureActive();

    const cached = this.computeCache.get(key);

    // Check if we have valid cached result
    if (cached !== undefined && !this.isCacheExpired(cached)) {
      cached.hits++;
      this.cacheHits++;
      return cached.value as T;
    }

    // Cache miss - compute result
    this.cacheMisses++;
    const value = await compute();

    const result: CachedResult<T> = {
      value,
      computedAt: Date.now(),
      hits: 0,
    };

    if (options?.ttl !== undefined) {
      result.ttl = options.ttl;
    }

    this.computeCache.set(key, result);

    return value;
  }

  public async invalidate(key: string): Promise<void> {
    this.ensureActive();
    this.computeCache.delete(key);
    return Promise.resolve();
  }

  public async invalidateAll(): Promise<void> {
    this.ensureActive();
    this.computeCache.clear();
    return Promise.resolve();
  }

  /**
   * MYELINATION TRACKING
   */

  public getMyelinatedPaths(): string[] {
    this.ensureActive();
    return Array.from(this.connectionPools.keys());
  }

  public getStats(): OligodendrocyteStats {
    let activeConnections = 0;
    let availableConnections = 0;

    for (const pool of this.connectionPools.values()) {
      for (const conn of pool) {
        if (conn.inUse) {
          activeConnections++;
        } else if (!this.isConnectionExpired(conn)) {
          availableConnections++;
        }
      }
    }

    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;

    return {
      activeConnections,
      availableConnections,
      myelinatedPaths: this.connectionPools.size,
      cachedOperations: this.computeCache.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate,
    };
  }

  /**
   * INTERNAL METHODS
   */

  private ensureActive(): void {
    if (!this.isActive) {
      throw new Error('Oligodendrocyte is not active');
    }
  }

  private getTotalConnectionCount(): number {
    let count = 0;

    for (const pool of this.connectionPools.values()) {
      count += pool.length;
    }

    return count;
  }

  private isConnectionExpired(connection: PooledConnection): boolean {
    if (this.connectionTTL === undefined) {
      return false;
    }

    return Date.now() - connection.createdAt > this.connectionTTL;
  }

  private isCacheExpired(cached: CachedResult): boolean {
    if (cached.ttl === undefined) {
      return false;
    }

    return Date.now() - cached.computedAt > cached.ttl;
  }

  private cleanupExpired(): void {
    // Cleanup expired connections
    for (const [poolId, pool] of this.connectionPools.entries()) {
      const validConnections = pool.filter((conn) => !this.isConnectionExpired(conn) || conn.inUse);

      if (validConnections.length === 0) {
        this.connectionPools.delete(poolId);
      } else {
        this.connectionPools.set(poolId, validConnections);
      }
    }

    // Cleanup expired cache entries
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.computeCache.entries()) {
      if (this.isCacheExpired(cached)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.computeCache.delete(key);
    }
  }
}
