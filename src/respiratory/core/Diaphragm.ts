/**
 * Diaphragm - Breathing Control & Resilience Patterns
 *
 * Handles:
 * - Retry logic with exponential backoff
 * - Rate limiting and throttling
 * - Circuit breaker pattern
 * - Bulkhead isolation
 * - Request coalescing
 */

import { EventEmitter } from 'events';

/**
 * Retry options
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

/**
 * Throttle options
 */
export interface ThrottleOptions {
  maxRequests?: number;
  windowMs?: number;
}

/**
 * Bulkhead options
 */
export interface BulkheadOptions {
  maxConcurrent?: number;
  maxQueue?: number;
}

/**
 * Circuit breaker states
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Diaphragm statistics
 */
export interface DiaphragmStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriedRequests: number;
  throttledRequests: number;
  circuitBreakerTrips: number;
  averageLatency: number;
}

/**
 * Diaphragm - Breathing control for external requests
 *
 * Features:
 * - Retry with exponential backoff
 * - Circuit breaker pattern
 * - Rate limiting/throttling
 * - Bulkhead isolation
 * - Request coalescing
 */
export class Diaphragm extends EventEmitter {
  private retryOptions: Required<RetryOptions>;
  private circuitOptions: Required<CircuitBreakerOptions>;
  private throttleOptions: Required<ThrottleOptions>;
  private bulkheadOptions: Required<BulkheadOptions>;

  // Circuit breaker state
  private circuitState: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private circuitOpenTime = 0;

  // Throttle state
  private requestTimestamps: number[] = [];

  // Bulkhead state
  private activeRequests = 0;
  private queuedRequests: Array<() => void> = [];

  // Request coalescing
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  // Statistics
  private stats: DiaphragmStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    throttledRequests: 0,
    circuitBreakerTrips: 0,
    averageLatency: 0,
  };
  private latencies: number[] = [];

  constructor(
    retryOptions: RetryOptions = {},
    circuitOptions: CircuitBreakerOptions = {},
    throttleOptions: ThrottleOptions = {},
    bulkheadOptions: BulkheadOptions = {},
  ) {
    super();

    this.retryOptions = {
      maxAttempts: retryOptions.maxAttempts ?? 3,
      initialDelay: retryOptions.initialDelay ?? 1000,
      maxDelay: retryOptions.maxDelay ?? 30000,
      backoffMultiplier: retryOptions.backoffMultiplier ?? 2,
      retryableErrors: retryOptions.retryableErrors ?? ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
    };

    this.circuitOptions = {
      failureThreshold: circuitOptions.failureThreshold ?? 5,
      successThreshold: circuitOptions.successThreshold ?? 2,
      timeout: circuitOptions.timeout ?? 60000,
      resetTimeout: circuitOptions.resetTimeout ?? 30000,
    };

    this.throttleOptions = {
      maxRequests: throttleOptions.maxRequests ?? 100,
      windowMs: throttleOptions.windowMs ?? 1000,
    };

    this.bulkheadOptions = {
      maxConcurrent: bulkheadOptions.maxConcurrent ?? 10,
      maxQueue: bulkheadOptions.maxQueue ?? 100,
    };
  }

  /**
   * Execute a function with retry logic
   */
  public async withRetry<T>(fn: () => Promise<T>, key?: string): Promise<T> {
    // Check for request coalescing
    if (key !== undefined && key.length > 0 && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)! as Promise<T>;
    }

    const promise = this.executeWithRetry(fn);

    if (key !== undefined && key.length > 0) {
      this.pendingRequests.set(key, promise);
      void promise.finally(() => this.pendingRequests.delete(key));
    }

    return promise;
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt < this.retryOptions.maxAttempts) {
      try {
        const result = await fn();
        if (attempt > 0) {
          this.stats.retriedRequests++;
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        if (!this.isRetryableError(error as Error) || attempt >= this.retryOptions.maxAttempts) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryOptions.initialDelay *
            Math.pow(this.retryOptions.backoffMultiplier, attempt - 1),
          this.retryOptions.maxDelay,
        );

        // Add jitter (±25%)
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        const finalDelay = delay + jitter;

        this.emit('retry', { attempt, delay: finalDelay, error });

        await this.sleep(finalDelay);
      }
    }

    throw lastError ?? new Error('Unknown error occurred during retry');
  }

  /**
   * Execute with circuit breaker
   */
  public async withCircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalRequests++;
    const startTime = Date.now();

    try {
      // Check circuit state
      if (this.circuitState === 'OPEN') {
        // Check if we should attempt to close
        if (Date.now() - this.circuitOpenTime >= this.circuitOptions.resetTimeout) {
          this.circuitState = 'HALF_OPEN';
          this.successCount = 0;
          this.emit('circuit:half-open');
        } else {
          this.stats.circuitBreakerTrips++;
          throw new Error('Circuit breaker is OPEN');
        }
      }

      // Execute function
      const result = await fn();

      // Record success
      this.recordSuccess();
      const latency = Date.now() - startTime;
      this.latencies.push(latency);
      this.stats.successfulRequests++;

      return result;
    } catch (error) {
      // Record failure
      this.recordFailure();
      this.stats.failedRequests++;
      throw error;
    } finally {
      // Update average latency
      if (this.latencies.length > 0) {
        this.stats.averageLatency =
          this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
      }
    }
  }

  /**
   * Execute with throttling
   */
  public async withThrottle<T>(fn: () => Promise<T>): Promise<T> {
    // Wait for throttle window
    await this.waitForThrottle();

    // Record timestamp
    this.requestTimestamps.push(Date.now());

    // Execute function
    return fn();
  }

  /**
   * Execute with bulkhead isolation
   */
  public async withBulkhead<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we can execute immediately
    if (this.activeRequests < this.bulkheadOptions.maxConcurrent) {
      return this.executeBulkhead(fn);
    }

    // Queue the request
    if (this.queuedRequests.length >= this.bulkheadOptions.maxQueue) {
      throw new Error('Bulkhead queue is full');
    }

    // Wait for a slot
    await new Promise<void>((resolve) => {
      this.queuedRequests.push(resolve);
    });

    return this.executeBulkhead(fn);
  }

  /**
   * Execute with all resilience patterns
   */
  public async breathe<T>(fn: () => Promise<T>, key?: string): Promise<T> {
    return this.withBulkhead(() =>
      this.withThrottle(() => this.withCircuitBreaker(() => this.withRetry(fn, key))),
    );
  }

  /**
   * Get statistics
   */
  public getStats(): DiaphragmStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      throttledRequests: 0,
      circuitBreakerTrips: 0,
      averageLatency: 0,
    };
    this.latencies = [];
  }

  /**
   * Get circuit breaker state
   */
  public getCircuitState(): CircuitState {
    return this.circuitState;
  }

  /**
   * Reset circuit breaker
   */
  public resetCircuit(): void {
    this.circuitState = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.circuitOpenTime = 0;
    this.emit('circuit:reset');
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    return this.retryOptions.retryableErrors.some((code) => error.message.includes(code));
  }

  /**
   * Record successful request
   */
  private recordSuccess(): void {
    this.failureCount = 0;

    if (this.circuitState === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.circuitOptions.successThreshold) {
        this.circuitState = 'CLOSED';
        this.successCount = 0;
        this.emit('circuit:closed');
      }
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(): void {
    this.failureCount++;

    if (this.circuitState === 'HALF_OPEN') {
      this.circuitState = 'OPEN';
      this.circuitOpenTime = Date.now();
      this.failureCount = 0;
      this.emit('circuit:open');
      return;
    }

    if (this.failureCount >= this.circuitOptions.failureThreshold) {
      this.circuitState = 'OPEN';
      this.circuitOpenTime = Date.now();
      this.emit('circuit:open');
    }
  }

  /**
   * Wait for throttle window
   */
  private async waitForThrottle(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.throttleOptions.windowMs;

    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > windowStart);

    // Check if we need to wait
    if (this.requestTimestamps.length >= this.throttleOptions.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      if (oldestTimestamp !== undefined) {
        const waitTime = oldestTimestamp + this.throttleOptions.windowMs - now;

        if (waitTime > 0) {
          this.stats.throttledRequests++;
          this.emit('throttled', { waitTime });
          await this.sleep(waitTime);
        }
      }
    }
  }

  /**
   * Execute with bulkhead tracking
   */
  private async executeBulkhead<T>(fn: () => Promise<T>): Promise<T> {
    this.activeRequests++;

    try {
      return await fn();
    } finally {
      this.activeRequests--;

      // Process queue
      if (this.queuedRequests.length > 0) {
        const next = this.queuedRequests.shift();
        if (next) {
          next();
        }
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
