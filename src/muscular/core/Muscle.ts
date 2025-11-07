/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Bone } from '../../skeletal/core/Bone';

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  delay: number;
  backoffMultiplier?: number;
}

/**
 * Muscle metadata
 */
export interface MuscleMetadata {
  description?: string;
  version?: string;
  [key: string]: any;
}

/**
 * Muscle configuration options
 */
export interface MuscleOptions {
  inputSchema?: Bone;
  outputSchema?: Bone;
  deterministic?: boolean;
  retry?: RetryPolicy;
  metadata?: MuscleMetadata;
}

/**
 * Execution context for muscles
 */
export interface ExecutionContext {
  signal?: AbortSignal;
  [key: string]: any;
}

/**
 * Muscle - Base class for business logic operations
 *
 * A Muscle wraps a pure function with:
 * - Input/output schema validation
 * - Automatic memoization for deterministic functions
 * - Error handling and retry logic
 * - Execution context and dependency injection
 * - Cancellation support
 */
export class Muscle<_TInput = unknown, TOutput = unknown> {
  public readonly name: string;
  public readonly metadata: MuscleMetadata;

  private readonly fn: (...args: unknown[]) => TOutput | Promise<TOutput>;
  private readonly options: MuscleOptions;
  private readonly memoCache: Map<string, TOutput>;

  constructor(
    name: string,
    fn: (...args: any[]) => TOutput | Promise<TOutput>,
    options: MuscleOptions = {},
  ) {
    this.name = name;
    this.fn = fn;
    this.options = options;
    this.metadata = options.metadata || {};
    this.memoCache = new Map();
  }

  /**
   * Execute the muscle synchronously
   */
  public execute(...args: any[]): TOutput {
    // Check for cancellation
    const context = this.extractContext(args);
    if (context?.signal?.aborted) {
      throw new Error('Operation was cancelled');
    }

    // Validate input
    if (this.options.inputSchema) {
      this.validateInput(args);
    }

    // Check memoization cache
    if (this.options.deterministic) {
      const cacheKey = this.getCacheKey(args);
      if (this.memoCache.has(cacheKey)) {
        return this.memoCache.get(cacheKey)!;
      }
    }

    // Execute function
    const result = this.fn(...args) as TOutput;

    // Validate output
    if (this.options.outputSchema) {
      this.validateOutput(result);
    }

    // Cache result if deterministic
    if (this.options.deterministic) {
      const cacheKey = this.getCacheKey(args);
      this.memoCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Execute the muscle asynchronously with retry support
   */
  public async executeAsync(...args: any[]): Promise<TOutput> {
    // Check for cancellation
    const context = this.extractContext(args);
    if (context?.signal?.aborted) {
      throw new Error('Operation was cancelled');
    }

    const retry = this.options.retry;
    let lastError: Error | undefined;

    const maxAttempts = retry?.maxAttempts || 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Validate input
        if (this.options.inputSchema) {
          this.validateInput(args);
        }

        // Check memoization cache
        if (this.options.deterministic) {
          const cacheKey = this.getCacheKey(args);
          if (this.memoCache.has(cacheKey)) {
            return this.memoCache.get(cacheKey)!;
          }
        }

        // Check for cancellation before execution
        if (context?.signal?.aborted) {
          throw new Error('Operation was cancelled');
        }

        // Execute function
        const result = await Promise.resolve(this.fn(...args));

        // Check for cancellation after execution
        if (context?.signal?.aborted) {
          throw new Error('Operation was cancelled');
        }

        // Validate output
        if (this.options.outputSchema) {
          this.validateOutput(result);
        }

        // Cache result if deterministic
        if (this.options.deterministic) {
          const cacheKey = this.getCacheKey(args);
          this.memoCache.set(cacheKey, result);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Don't retry if cancelled
        if (
          context?.signal?.aborted ||
          (error instanceof Error && error.message.includes('cancelled'))
        ) {
          throw error;
        }

        // If not last attempt and retry is configured, wait and retry
        if (attempt < maxAttempts && retry) {
          const delay = retry.delay * Math.pow(retry.backoffMultiplier || 1, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Validate input against schema
   */
  private validateInput(args: any[]): void {
    if (!this.options.inputSchema) {
      return;
    }

    // If args is a single object, validate it directly
    // Otherwise, validate first arg (assuming it's the params object)
    const input = args.length === 1 ? args[0] : args[0];

    const validation = this.options.inputSchema.validate(input);
    if (!validation.valid) {
      throw new Error(`Input validation failed: ${validation.errors.map(String).join(', ')}`);
    }
  }

  /**
   * Validate output against schema
   */
  private validateOutput(output: TOutput): void {
    if (!this.options.outputSchema) {
      return;
    }

    const validation = this.options.outputSchema.validate(output);
    if (!validation.valid) {
      throw new Error(`Output validation failed: ${validation.errors.map(String).join(', ')}`);
    }
  }

  /**
   * Generate cache key from arguments
   */
  private getCacheKey(args: any[]): string {
    try {
      // Filter out context object if present
      const argsWithoutContext = args.filter((arg, index) => {
        // Last argument might be context
        if (index === args.length - 1 && typeof arg === 'object' && arg !== null) {
          // Check if it looks like a context object
          if ('signal' in arg || 'logger' in arg || 'offset' in arg) {
            return false;
          }
        }
        return true;
      });

      return JSON.stringify(argsWithoutContext);
    } catch {
      // If serialization fails, use a simple string representation
      return args.map((arg) => String(arg)).join(',');
    }
  }

  /**
   * Extract execution context from arguments
   */
  private extractContext(args: any[]): ExecutionContext | undefined {
    // Check if last argument is a context object
    if (args.length > 0) {
      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'object' && lastArg !== null) {
        // Check if it has context-like properties
        if ('signal' in lastArg || 'logger' in lastArg) {
          return lastArg as ExecutionContext;
        }
      }
    }
    return undefined;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear memoization cache
   */
  public clearCache(): void {
    this.memoCache.clear();
  }

  /**
   * Get cache size
   */
  public getCacheSize(): number {
    return this.memoCache.size;
  }
}
