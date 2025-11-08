/**
 * ResourcePool - Connection Pool Manager
 *
 * Manages a pool of resource connections with:
 * - Connection reuse
 * - Automatic scaling
 * - Connection health monitoring
 * - Resource limits
 */

import { EventEmitter } from 'events';

/**
 * Pool configuration
 */
export interface PoolConfig<T> {
  min?: number;
  max?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  factory: () => Promise<T>;
  destroyer?: (resource: T) => Promise<void>;
  validator?: (resource: T) => Promise<boolean>;
}

/**
 * Pooled resource wrapper
 */
interface PooledResource<T> {
  resource: T;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  total: number;
  available: number;
  inUse: number;
  pending: number;
  created: number;
  destroyed: number;
}

/**
 * Resource pool for connection management
 */
export class ResourcePool<T> extends EventEmitter {
  private pool: PooledResource<T>[] = [];
  private waitQueue: Array<{
    resolve: (resource: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private min: number;
  private max: number;
  private acquireTimeout: number;
  private idleTimeout: number;
  private factory: () => Promise<T>;
  private destroyer?: (resource: T) => Promise<void>;
  private validator?: (resource: T) => Promise<boolean>;
  private stats = {
    created: 0,
    destroyed: 0,
  };
  private idleCheckTimer: NodeJS.Timeout | null = null;
  private draining: boolean = false;

  constructor(config: PoolConfig<T>) {
    super();
    this.min = config.min ?? 0;
    this.max = config.max ?? 10;
    this.acquireTimeout = config.acquireTimeout ?? 30000;
    this.idleTimeout = config.idleTimeout ?? 60000;
    this.factory = config.factory;
    if (config.destroyer !== undefined) {
      this.destroyer = config.destroyer;
    }
    if (config.validator !== undefined) {
      this.validator = config.validator;
    }

    this.startIdleCheck();
  }

  /**
   * Acquire a resource from the pool
   */
  public async acquire(): Promise<T> {
    if (this.draining) {
      throw new Error('Pool is draining');
    }

    // Try to find an available resource
    const available = this.pool.find((pr) => !pr.inUse);
    if (available !== undefined) {
      // Validate if validator is provided
      if (this.validator !== undefined) {
        const valid = await this.validator(available.resource);
        if (!valid) {
          await this.destroyResource(available);
          return this.acquire(); // Try again
        }
      }

      available.inUse = true;
      available.lastUsedAt = Date.now();
      this.emit('resource:acquired');
      return available.resource;
    }

    // Create new resource if under limit
    if (this.pool.length < this.max) {
      const resource = await this.createResource();
      this.emit('resource:acquired');
      return resource;
    }

    // Wait for a resource to become available
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex((w) => w.resolve === resolve);
        if (index >= 0) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Acquire timeout'));
      }, this.acquireTimeout);

      this.waitQueue.push({ resolve, reject, timeout });
      this.emit('resource:waiting', this.waitQueue.length);
    });
  }

  /**
   * Release a resource back to the pool
   */
  public async release(resource: T): Promise<void> {
    const pooled = this.pool.find((pr) => pr.resource === resource);
    if (pooled === undefined) {
      throw new Error('Resource not found in pool');
    }

    pooled.inUse = false;
    pooled.lastUsedAt = Date.now();

    // If there are waiters, give it to the next one
    const waiter = this.waitQueue.shift();
    if (waiter !== undefined) {
      clearTimeout(waiter.timeout);
      pooled.inUse = true;
      waiter.resolve(resource);
      this.emit('resource:released');
      return Promise.resolve();
    }

    this.emit('resource:released');
    return Promise.resolve();
  }

  /**
   * Remove and destroy a resource
   */
  public async destroy(resource: T): Promise<void> {
    const pooled = this.pool.find((pr) => pr.resource === resource);
    if (pooled !== undefined) {
      await this.destroyResource(pooled);
    }
  }

  /**
   * Drain the pool (reject new requests, wait for existing to complete)
   */
  public async drain(): Promise<void> {
    this.draining = true;
    this.stopIdleCheck();

    // Reject all waiting requests
    this.waitQueue.forEach((waiter) => {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool is draining'));
    });
    this.waitQueue = [];

    // Wait for all resources to be released
    while (this.pool.some((pr) => pr.inUse)) {
      await this.sleep(100);
    }

    // Destroy all resources
    await Promise.all(this.pool.map((pr) => this.destroyResource(pr)));
    this.pool = [];

    this.emit('drained');
  }

  /**
   * Get pool statistics
   */
  public getStats(): PoolStats {
    return {
      total: this.pool.length,
      available: this.pool.filter((pr) => !pr.inUse).length,
      inUse: this.pool.filter((pr) => pr.inUse).length,
      pending: this.waitQueue.length,
      created: this.stats.created,
      destroyed: this.stats.destroyed,
    };
  }

  /**
   * Create a new resource
   */
  private async createResource(): Promise<T> {
    try {
      const resource = await this.factory();
      this.pool.push({
        resource,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        inUse: true,
      });
      this.stats.created++;
      this.emit('resource:created');
      return resource;
    } catch (error) {
      this.emit('resource:error', error);
      throw error;
    }
  }

  /**
   * Destroy a resource
   */
  private async destroyResource(pooled: PooledResource<T>): Promise<void> {
    const index = this.pool.indexOf(pooled);
    if (index >= 0) {
      this.pool.splice(index, 1);
    }

    if (this.destroyer !== undefined) {
      try {
        await this.destroyer(pooled.resource);
      } catch (error) {
        this.emit('resource:error', error);
      }
    }

    this.stats.destroyed++;
    this.emit('resource:destroyed');
  }

  /**
   * Start checking for idle resources
   */
  private startIdleCheck(): void {
    this.idleCheckTimer = setInterval(() => {
      const now = Date.now();
      const idle = this.pool.filter(
        (pr) => !pr.inUse && now - pr.lastUsedAt > this.idleTimeout && this.pool.length > this.min,
      );

      idle.forEach((pr) => {
        void this.destroyResource(pr);
      });
    }, this.idleTimeout / 2);
  }

  /**
   * Stop idle check timer
   */
  private stopIdleCheck(): void {
    if (this.idleCheckTimer !== null) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = null;
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
