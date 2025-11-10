/**
 * Astrocyte - State Management and Homeostasis
 *
 * Biological role: Astrocytes maintain extracellular ion balance, regulate
 * neurotransmitter levels, provide metabolic support, and form the blood-brain barrier.
 *
 * Software mapping: StateManager services that maintain application state, manage shared
 * memory, and ensure data consistency across distributed neurons. Implements multi-level
 * state storage with LRU eviction, TTL expiration, and cache statistics.
 */

interface AstrocyteConfig {
  readonly id: string;
  readonly cacheSize?: number;
  readonly ttl?: number; // Default TTL in milliseconds
}

interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  ttl?: number | undefined;
  accessCount: number;
  lastAccess: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  capacity: number;
  hitRate: number;
  evictions: number;
}

interface SetOptions {
  ttl?: number;
}

export class Astrocyte {
  public readonly id: string;
  public isActive = false;

  private readonly cacheSize: number;
  private readonly defaultTtl?: number | undefined;

  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = [];

  // Statistics
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  // Cleanup timer
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(config: AstrocyteConfig) {
    this.id = config.id;
    this.cacheSize = config.cacheSize ?? 1000;
    this.defaultTtl = config.ttl;
  }

  /**
   * LIFECYCLE MANAGEMENT
   */

  public async activate(): Promise<void> {
    if (this.isActive) {
      throw new Error('Astrocyte is already active');
    }

    this.isActive = true;

    // Start periodic cleanup for expired entries
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, 1000); // Check every second

    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    this.isActive = false;

    if (this.cleanupTimer !== undefined) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.cache.clear();
    this.accessOrder = [];

    return Promise.resolve();
  }

  /**
   * WORKING MEMORY OPERATIONS
   */

  public async set<T = unknown>(key: string, value: T, options?: SetOptions): Promise<void> {
    this.ensureActive();

    const now = Date.now();
    const ttl = options?.ttl ?? this.defaultTtl;

    // Check if we need to evict
    if (!this.cache.has(key) && this.cache.size >= this.cacheSize) {
      this.evictLRU();
    }

    // Store entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      accessCount: 0,
      lastAccess: now,
    };

    if (ttl !== undefined) {
      entry.ttl = ttl;
    }

    this.cache.set(key, entry);

    // Update access order
    this.updateAccessOrder(key);

    return Promise.resolve();
  }

  public async get<T = unknown>(key: string): Promise<T | undefined> {
    this.ensureActive();

    const entry = this.cache.get(key);

    if (entry === undefined) {
      this.misses++;
      return Promise.resolve(undefined);
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.misses++;
      return Promise.resolve(undefined);
    }

    // Update statistics
    this.hits++;
    entry.accessCount++;
    entry.lastAccess = Date.now();

    // Update LRU
    this.updateAccessOrder(key);

    return Promise.resolve(entry.value as T);
  }

  public async delete(key: string): Promise<boolean> {
    this.ensureActive();

    const deleted = this.cache.delete(key);

    if (deleted) {
      this.removeFromAccessOrder(key);
    }

    return Promise.resolve(deleted);
  }

  public async has(key: string): Promise<boolean> {
    this.ensureActive();

    const entry = this.cache.get(key);

    if (entry === undefined) {
      return false;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  public async clear(): Promise<void> {
    this.ensureActive();

    this.cache.clear();
    this.accessOrder = [];

    return Promise.resolve();
  }

  /**
   * STATE SYNCHRONIZATION
   */

  public snapshot(): Record<string, unknown> {
    this.ensureActive();

    const result: Record<string, unknown> = {};

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        result[key] = entry.value;
      }
    }

    return result;
  }

  public async restore(snapshot: Record<string, unknown>): Promise<void> {
    this.ensureActive();

    for (const [key, value] of Object.entries(snapshot)) {
      await this.set(key, value);
    }

    return Promise.resolve();
  }

  /**
   * NAMESPACE SUPPORT
   */

  public keys(pattern?: string): string[] {
    this.ensureActive();

    const allKeys = Array.from(this.cache.keys());

    if (pattern === undefined) {
      return allKeys;
    }

    // Validate pattern to prevent ReDoS attacks (CWE-1333)
    this.validateGlobPattern(pattern);

    // Simple glob pattern matching (supports * and ?)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');

    return allKeys.filter((key) => regex.test(key));
  }

  /**
   * Validate glob pattern to prevent ReDoS attacks
   * Checks for dangerous patterns that could cause exponential backtracking
   */
  private validateGlobPattern(pattern: string): void {
    // 1. Check pattern length (prevent extremely long patterns)
    if (pattern.length > 1000) {
      throw new Error('Pattern too long (max 1000 characters)');
    }

    // 2. Check for consecutive wildcards first (e.g., "**", "***", etc.)
    if (/\*{2,}/.test(pattern)) {
      throw new Error('Pattern contains consecutive wildcards');
    }

    // 3. Check wildcard density (prevent excessive wildcards)
    const wildcardCount = (pattern.match(/[*?]/g) || []).length;
    const wildcardDensity = wildcardCount / pattern.length;

    if (wildcardDensity > 0.5) {
      throw new Error('Pattern has too many wildcards (max 50% density)');
    }

    // 4. Limit total number of wildcards
    if (wildcardCount > 20) {
      throw new Error('Pattern has too many wildcards (max 20)');
    }

    // 5. Check for forbidden patterns that could cause catastrophic backtracking
    const dangerousPatterns = [
      /(\*.*){3,}/, // Multiple wildcards with content between
      /(\?.*){10,}/, // Many single-char wildcards
    ];

    for (const dangerous of dangerousPatterns) {
      if (dangerous.test(pattern)) {
        throw new Error('Pattern contains potentially dangerous regex structure');
      }
    }
  }

  /**
   * STATISTICS AND MONITORING
   */

  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      capacity: this.cacheSize,
      hitRate,
      evictions: this.evictions,
    };
  }

  public resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * INTERNAL METHODS
   */

  private ensureActive(): void {
    if (!this.isActive) {
      throw new Error('Astrocyte is not active');
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.ttl === undefined) {
      return false;
    }

    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl !== undefined && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }
  }

  private evictLRU(): void {
    // Remove least recently used (first in access order)
    const lruKey = this.accessOrder[0];

    if (lruKey !== undefined) {
      this.cache.delete(lruKey);
      this.accessOrder.shift();
      this.evictions++;
    }
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);

    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);

    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}
