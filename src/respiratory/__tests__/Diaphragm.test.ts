import { Diaphragm } from '../core/Diaphragm';

describe('Diaphragm - Breathing Control', () => {
  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      const diaphragm = new Diaphragm({ maxAttempts: 3, initialDelay: 10 });
      let attempts = 0;

      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('ECONNREFUSED');
          throw error;
        }
        return 'success';
      };

      const result = await diaphragm.withRetry(fn);

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should respect maxAttempts', async () => {
      const diaphragm = new Diaphragm({ maxAttempts: 2, initialDelay: 10 });
      let attempts = 0;

      const fn = async () => {
        attempts++;
        throw new Error('ECONNREFUSED');
      };

      await expect(diaphragm.withRetry(fn)).rejects.toThrow('ECONNREFUSED');
      expect(attempts).toBe(2);
    });

    it('should not retry non-retryable errors', async () => {
      const diaphragm = new Diaphragm({ maxAttempts: 3, initialDelay: 10 });
      let attempts = 0;

      const fn = async () => {
        attempts++;
        throw new Error('INVALID_REQUEST');
      };

      await expect(diaphragm.withRetry(fn)).rejects.toThrow('INVALID_REQUEST');
      expect(attempts).toBe(1);
    });

    it('should apply exponential backoff', async () => {
      const diaphragm = new Diaphragm({
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
      });
      let attempts = 0;
      const timestamps: number[] = [];

      const fn = async () => {
        timestamps.push(Date.now());
        attempts++;
        if (attempts < 3) {
          throw new Error('ETIMEDOUT');
        }
        return 'success';
      };

      await diaphragm.withRetry(fn);

      // Check that delays are increasing
      expect(timestamps.length).toBe(3);
      const delay1 = timestamps[1]! - timestamps[0]!;
      const delay2 = timestamps[2]! - timestamps[1]!;
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should emit retry events', async () => {
      const diaphragm = new Diaphragm({ maxAttempts: 3, initialDelay: 10 });
      const retryEvents: unknown[] = [];
      diaphragm.on('retry', (event) => {
        retryEvents.push(event);
      });

      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('ECONNREFUSED');
        }
        return 'success';
      };

      await diaphragm.withRetry(fn);

      expect(retryEvents.length).toBe(1);
    });
  });

  describe('Circuit Breaker', () => {
    it('should start in CLOSED state', () => {
      const diaphragm = new Diaphragm();
      expect(diaphragm.getCircuitState()).toBe('CLOSED');
    });

    it('should open circuit after failure threshold', async () => {
      const diaphragm = new Diaphragm(undefined, { failureThreshold: 3 });

      for (let i = 0; i < 3; i++) {
        try {
          await diaphragm.withCircuitBreaker(async () => {
            throw new Error('Service unavailable');
          });
        } catch {
          // Expected
        }
      }

      expect(diaphragm.getCircuitState()).toBe('OPEN');
    });

    it('should reject requests when circuit is OPEN', async () => {
      const diaphragm = new Diaphragm(undefined, { failureThreshold: 2, resetTimeout: 1000 });

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await diaphragm.withCircuitBreaker(async () => {
            throw new Error('Failure');
          });
        } catch {
          // Expected
        }
      }

      // Should reject immediately
      await expect(diaphragm.withCircuitBreaker(async () => 'test')).rejects.toThrow(
        'Circuit breaker is OPEN',
      );
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const diaphragm = new Diaphragm(undefined, {
        failureThreshold: 2,
        resetTimeout: 50,
      });

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await diaphragm.withCircuitBreaker(async () => {
            throw new Error('Failure');
          });
        } catch {
          // Expected
        }
      }

      expect(diaphragm.getCircuitState()).toBe('OPEN');

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should allow one request
      await diaphragm.withCircuitBreaker(async () => 'test');

      expect(diaphragm.getCircuitState()).toBe('HALF_OPEN');
    });

    it('should close circuit after successful requests in HALF_OPEN', async () => {
      const diaphragm = new Diaphragm(undefined, {
        failureThreshold: 2,
        successThreshold: 2,
        resetTimeout: 50,
      });

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await diaphragm.withCircuitBreaker(async () => {
            throw new Error('Failure');
          });
        } catch {
          // Expected
        }
      }

      // Wait for reset
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Make successful requests
      await diaphragm.withCircuitBreaker(async () => 'success1');
      await diaphragm.withCircuitBreaker(async () => 'success2');

      expect(diaphragm.getCircuitState()).toBe('CLOSED');
    });

    it('should emit circuit state events', async () => {
      const diaphragm = new Diaphragm(undefined, { failureThreshold: 2 });
      const events: string[] = [];

      diaphragm.on('circuit:open', () => events.push('open'));
      diaphragm.on('circuit:half-open', () => events.push('half-open'));
      diaphragm.on('circuit:closed', () => events.push('closed'));

      // Trip circuit
      for (let i = 0; i < 2; i++) {
        try {
          await diaphragm.withCircuitBreaker(async () => {
            throw new Error('Failure');
          });
        } catch {
          // Expected
        }
      }

      expect(events).toContain('open');
    });

    it('should reset circuit manually', async () => {
      const diaphragm = new Diaphragm(undefined, { failureThreshold: 2 });

      // Trip circuit
      for (let i = 0; i < 2; i++) {
        try {
          await diaphragm.withCircuitBreaker(async () => {
            throw new Error('Failure');
          });
        } catch {
          // Expected
        }
      }

      expect(diaphragm.getCircuitState()).toBe('OPEN');

      diaphragm.resetCircuit();
      expect(diaphragm.getCircuitState()).toBe('CLOSED');
    });
  });

  describe('Throttling', () => {
    it('should allow requests within limit', async () => {
      const diaphragm = new Diaphragm(undefined, undefined, {
        maxRequests: 5,
        windowMs: 1000,
      });

      const results = await Promise.all([
        diaphragm.withThrottle(async () => 1),
        diaphragm.withThrottle(async () => 2),
        diaphragm.withThrottle(async () => 3),
      ]);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should throttle requests exceeding limit', async () => {
      const diaphragm = new Diaphragm(undefined, undefined, {
        maxRequests: 2,
        windowMs: 100,
      });

      const results: number[] = [];
      const startTime = Date.now();

      // Execute requests sequentially to ensure they hit the limit
      results.push(await diaphragm.withThrottle(async () => 1));
      results.push(await diaphragm.withThrottle(async () => 2));
      results.push(await diaphragm.withThrottle(async () => 3));

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Should wait for window
      expect(results).toEqual([1, 2, 3]);
    });

    it('should emit throttle events', async () => {
      const diaphragm = new Diaphragm(undefined, undefined, {
        maxRequests: 1,
        windowMs: 100,
      });

      const throttleEvents: unknown[] = [];
      diaphragm.on('throttled', (event) => {
        throttleEvents.push(event);
      });

      await diaphragm.withThrottle(async () => 1);
      await diaphragm.withThrottle(async () => 2);

      expect(throttleEvents.length).toBe(1);
    });
  });

  describe('Bulkhead Isolation', () => {
    it('should limit concurrent requests', async () => {
      const diaphragm = new Diaphragm(undefined, undefined, undefined, {
        maxConcurrent: 2,
        maxQueue: 10,
      });

      let concurrent = 0;
      let maxConcurrent = 0;

      const fn = async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 50));
        concurrent--;
        return 'done';
      };

      await Promise.all([
        diaphragm.withBulkhead(fn),
        diaphragm.withBulkhead(fn),
        diaphragm.withBulkhead(fn),
        diaphragm.withBulkhead(fn),
      ]);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should reject when queue is full', async () => {
      const diaphragm = new Diaphragm(undefined, undefined, undefined, {
        maxConcurrent: 1,
        maxQueue: 2,
      });

      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'done';
      };

      const promises = [
        diaphragm.withBulkhead(fn), // Active
        diaphragm.withBulkhead(fn), // Queued 1
        diaphragm.withBulkhead(fn), // Queued 2
        diaphragm.withBulkhead(fn), // Should reject
      ];

      await expect(promises[3]).rejects.toThrow('Bulkhead queue is full');
    });
  });

  describe('Request Coalescing', () => {
    it('should coalesce identical requests', async () => {
      const diaphragm = new Diaphragm({ maxAttempts: 1 });
      let callCount = 0;

      const fn = async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'result';
      };

      const [result1, result2, result3] = await Promise.all([
        diaphragm.withRetry(fn, 'key1'),
        diaphragm.withRetry(fn, 'key1'),
        diaphragm.withRetry(fn, 'key1'),
      ]);

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(result3).toBe('result');
      expect(callCount).toBe(1); // Should only call once
    });

    it('should not coalesce requests with different keys', async () => {
      const diaphragm = new Diaphragm({ maxAttempts: 1 });
      let callCount = 0;

      const fn = async () => {
        callCount++;
        return 'result';
      };

      await Promise.all([
        diaphragm.withRetry(fn, 'key1'),
        diaphragm.withRetry(fn, 'key2'),
        diaphragm.withRetry(fn, 'key3'),
      ]);

      expect(callCount).toBe(3); // Should call three times
    });
  });

  describe('Breathe (Combined Patterns)', () => {
    it('should apply all resilience patterns', async () => {
      const diaphragm = new Diaphragm(
        { maxAttempts: 2, initialDelay: 10 },
        { failureThreshold: 5 },
        { maxRequests: 10, windowMs: 1000 },
        { maxConcurrent: 5, maxQueue: 10 },
      );

      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('ECONNREFUSED');
        }
        return 'success';
      };

      const result = await diaphragm.breathe(fn);

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('Statistics', () => {
    it('should track request statistics', async () => {
      const diaphragm = new Diaphragm({ maxAttempts: 1 });

      await diaphragm.withCircuitBreaker(async () => 'success');

      try {
        await diaphragm.withCircuitBreaker(async () => {
          throw new Error('Failure');
        });
      } catch {
        // Expected
      }

      const stats = diaphragm.getStats();

      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(1);
    });

    it('should calculate average latency', async () => {
      const diaphragm = new Diaphragm();

      await diaphragm.withCircuitBreaker(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'done';
      });

      const stats = diaphragm.getStats();
      expect(stats.averageLatency).toBeGreaterThan(40);
    });

    it('should reset statistics', () => {
      const diaphragm = new Diaphragm();
      diaphragm.getStats().totalRequests = 100;

      diaphragm.resetStats();

      const stats = diaphragm.getStats();
      expect(stats.totalRequests).toBe(0);
    });
  });
});
