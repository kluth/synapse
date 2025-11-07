/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  expiresAt?: number | undefined;
  tags?: string[] | undefined;
  createdAt: number;
}

/**
 * Options for setting cache entries
 */
export interface SetOptions {
  ttl?: number;
  tags?: string[];
}

/**
 * Options for MuscleMemory
 */
export interface MuscleMemoryOptions {
  ttl?: number;
  maxSize?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  size: number;
}

/**
 * MuscleMemory - Advanced caching system
 *
 * Features:
 * - TTL (Time To Live) support
 * - LRU (Least Recently Used) eviction
 * - Multiple invalidation strategies (pattern, tag, predicate)
 * - Cache statistics
 * - Cache stampede prevention
 */
export class MuscleMemory<T> {
  private readonly cache: Map<string, CacheEntry<T>>;
  private readonly accessOrder: string[]; // For LRU tracking
  private readonly options: Required<MuscleMemoryOptions>;
  private readonly pendingLoads: Map<string, Promise<T>>;

  // Statistics
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: MuscleMemoryOptions = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.pendingLoads = new Map();
    this.options = {
      ttl: options.ttl ?? 0,
      maxSize: options.maxSize ?? Infinity,
    };
  }

  /**
   * Get a value from cache
   */
  public get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.misses++;
      return undefined;
    }

    // Update LRU order
    this.updateAccessOrder(key);
    this.hits++;

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  public set(key: string, value: T, options: SetOptions = {}): void {
    // Calculate expiration time
    const ttl = options.ttl ?? this.options.ttl;
    const expiresAt = ttl > 0 ? Date.now() + ttl : undefined;

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      tags: options.tags,
      createdAt: Date.now(),
    };

    // If key already exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, entry);
      this.updateAccessOrder(key);
      return;
    }

    // Check if we need to evict
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.removeFromAccessOrder(key);
    }
    return result;
  }

  /**
   * Clear all entries from cache
   */
  public clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
  }

  /**
   * Get cache size
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Get or load a value with cache stampede prevention
   */
  public async getOrLoad(
    key: string,
    loader: (key: string) => Promise<T>,
    options?: SetOptions,
  ): Promise<T> {
    // Check if value is in cache
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if there's already a pending load for this key
    const pending = this.pendingLoads.get(key);
    if (pending) {
      return pending;
    }

    // Start loading
    const loadPromise = loader(key)
      .then((value) => {
        this.set(key, value, options);
        this.pendingLoads.delete(key);
        return value;
      })
      .catch((error) => {
        this.pendingLoads.delete(key);
        throw error;
      });

    this.pendingLoads.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Invalidate entries matching a pattern
   */
  public invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * Invalidate entries by tag
   */
  public invalidateByTag(tag: string): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * Invalidate entries by predicate
   */
  public invalidateWhere(predicate: (value: T) => boolean): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (predicate(entry.value)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      evictions: this.evictions,
      size: this.cache.size,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruKey = this.accessOrder.shift()!;
    this.cache.delete(lruKey);
    this.evictions++;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}
