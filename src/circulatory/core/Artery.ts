import type { BloodCell } from './BloodCell';
import { EventEmitter } from 'events';

/**
 * Artery options
 */
export interface ArteryOptions {
  maxBufferSize?: number;
  highWaterMark?: number;
  lowWaterMark?: number;
  maxRate?: number; // Messages per second
  burstSize?: number;
  batchSize?: number;
  batchTimeout?: number; // Milliseconds
}

/**
 * Stream statistics
 */
export interface ArteryStats {
  sent: number;
  delivered: number;
  errors: number;
  dropped: number;
  throughput: number; // Messages per second
  avgLatency: number; // Milliseconds
}

/**
 * Data handler callback
 */
type DataHandler = (cell: BloodCell) => void | Promise<void>;

/**
 * Batch handler callback
 */
type BatchHandler = (cells: BloodCell[]) => void | Promise<void>;

/**
 * Error handler callback
 */
type ErrorHandler = (error: Error) => void;

/**
 * Backpressure handler callback
 */
type BackpressureHandler = (bufferSize: number) => void;

/**
 * Transform function
 */
type TransformFunction = (cell: BloodCell) => BloodCell;

/**
 * Filter function
 */
type FilterFunction = (cell: BloodCell) => boolean;

/**
 * Artery - Outbound data stream with backpressure and flow control
 *
 * Features:
 * - Backpressure management (high/low water marks)
 * - Flow control (rate limiting, throttling)
 * - Batching (by size or time)
 * - Stream transformations (map, filter)
 * - Error handling
 * - Statistics tracking
 */
export class Artery extends EventEmitter {
  public readonly name: string;
  private options: Required<ArteryOptions>;
  private active = false;
  private paused = false;
  private buffer: BloodCell[] = [];
  private batch: BloodCell[] = [];
  private batchTimer?: NodeJS.Timeout;
  private processingLoop?: NodeJS.Timeout;

  // Handlers
  private dataHandlers: DataHandler[] = [];
  private batchHandlers: BatchHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private backpressureHandlers: BackpressureHandler[] = [];

  // Transformations
  private transformations: TransformFunction[] = [];
  private filters: FilterFunction[] = [];

  // Rate limiting
  private messageTimestamps: number[] = [];
  private burstTokens: number;

  // Statistics
  private stats: ArteryStats = {
    sent: 0,
    delivered: 0,
    errors: 0,
    dropped: 0,
    throughput: 0,
    avgLatency: 0,
  };

  private latencies: number[] = [];

  constructor(name: string, options: ArteryOptions = {}) {
    super();
    this.name = name;
    this.options = {
      maxBufferSize: options.maxBufferSize ?? 1000,
      highWaterMark: options.highWaterMark ?? 0.8 * (options.maxBufferSize ?? 1000),
      lowWaterMark: options.lowWaterMark ?? 0.3 * (options.maxBufferSize ?? 1000),
      maxRate: options.maxRate ?? Infinity,
      burstSize: options.burstSize ?? 0,
      batchSize: options.batchSize ?? 0,
      batchTimeout: options.batchTimeout ?? 0,
    };

    this.burstTokens = this.options.burstSize;
  }

  /**
   * Check if stream is active
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * Check if stream is paused
   */
  public isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get current buffer size
   */
  public getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Start the stream
   */
  public start(): void {
    if (this.active) {
      return;
    }

    this.active = true;
    this.startProcessing();
  }

  /**
   * Stop the stream
   */
  public async stop(): Promise<void> {
    if (!this.active) {
      return;
    }

    this.active = false;

    // Clear timers
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    if (this.processingLoop) {
      clearTimeout(this.processingLoop);
    }

    // Drain buffer
    while (this.buffer.length > 0) {
      await this.processMessage();
      await this.sleep(1);
    }

    // Flush remaining batch
    if (this.batch.length > 0) {
      await this.flushBatch();
    }
  }

  /**
   * Pause the stream
   */
  public pause(): void {
    this.paused = true;
  }

  /**
   * Resume the stream
   */
  public resume(): void {
    this.paused = false;
  }

  /**
   * Send a message through the stream
   */
  public send(cell: BloodCell): void {
    if (!this.active) {
      throw new Error('Artery is not active');
    }

    this.stats.sent++;

    // Check buffer capacity
    if (this.buffer.length >= this.options.maxBufferSize) {
      this.stats.dropped++;
      this.emitBackpressure(this.buffer.length);
      throw new Error('Buffer full - backpressure applied');
    }

    // Add to buffer
    this.buffer.push(cell);

    // Check high water mark
    if (this.buffer.length >= this.options.highWaterMark) {
      this.paused = true;
      this.emitBackpressure(this.buffer.length);
    }
  }

  /**
   * Register data handler
   */
  public onData(handler: DataHandler): () => void {
    this.dataHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.dataHandlers.indexOf(handler);
      if (index > -1) {
        this.dataHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register batch handler
   */
  public onBatch(handler: BatchHandler): () => void {
    this.batchHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.batchHandlers.indexOf(handler);
      if (index > -1) {
        this.batchHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register error handler
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register backpressure handler
   */
  public onBackpressure(handler: BackpressureHandler): () => void {
    this.backpressureHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.backpressureHandlers.indexOf(handler);
      if (index > -1) {
        this.backpressureHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Add transformation
   */
  public transform(fn: TransformFunction): this {
    this.transformations.push(fn);
    return this;
  }

  /**
   * Add filter
   */
  public filter(fn: FilterFunction): this {
    this.filters.push(fn);
    return this;
  }

  /**
   * Flush current batch
   */
  public async flush(): Promise<void> {
    if (this.batch.length > 0) {
      await this.flushBatch();
    }
  }

  /**
   * Get statistics
   */
  public getStats(): ArteryStats {
    return { ...this.stats };
  }

  /**
   * Start processing loop
   */
  private startProcessing(): void {
    this.processingLoop = setTimeout(() => {
      void this.processLoop();
    }, 0);
  }

  /**
   * Processing loop
   */
  private async processLoop(): Promise<void> {
    // Check low water mark before processing
    if (this.paused && this.buffer.length < this.options.lowWaterMark) {
      this.paused = false;
    }

    // Continue processing even when paused to drain buffer (but slower)
    while (this.active && this.buffer.length > 0) {
      // Slow down processing when paused to simulate backpressure
      if (this.paused) {
        await this.sleep(20);
      }

      // Check rate limit
      if (!this.canSend()) {
        await this.sleep(10);
        continue;
      }

      await this.processMessage();

      // Check low water mark after each message
      if (this.paused && this.buffer.length < this.options.lowWaterMark) {
        this.paused = false;
      }
    }

    // Calculate throughput
    this.calculateThroughput();

    // Schedule next iteration if stream is still active
    if (this.active) {
      this.processingLoop = setTimeout(() => {
        void this.processLoop();
      }, 10);
    }
  }

  /**
   * Process single message
   */
  private async processMessage(): Promise<void> {
    const cell = this.buffer.shift();
    if (!cell) {
      return;
    }

    const startTime = Date.now();

    try {
      // Apply transformations first
      let transformed = cell;
      for (const transform of this.transformations) {
        transformed = transform(transformed);
      }

      // Apply filters after transformations
      for (const filter of this.filters) {
        if (!filter(transformed)) {
          return; // Filtered out
        }
      }

      // Handle batching
      if (this.options.batchSize > 0 || this.options.batchTimeout > 0) {
        this.addToBatch(transformed);
      } else {
        // Deliver immediately
        await this.deliverMessage(transformed);
      }

      this.stats.delivered++;

      // Track latency
      const latency = Date.now() - startTime;
      this.latencies.push(latency);
      if (this.latencies.length > 100) {
        this.latencies.shift();
      }

      // Update rate limiting
      this.messageTimestamps.push(Date.now());
    } catch (error) {
      this.stats.errors++;
      this.emitError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Add message to batch
   */
  private addToBatch(cell: BloodCell): void {
    this.batch.push(cell);

    // Check size-based batching
    if (this.options.batchSize > 0 && this.batch.length >= this.options.batchSize) {
      void this.flushBatch();
      return;
    }

    // Start timeout-based batching
    if (this.options.batchTimeout > 0 && !this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        void this.flushBatch();
      }, this.options.batchTimeout);
    }
  }

  /**
   * Flush batch
   */
  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) {
      return;
    }

    const batchToSend = [...this.batch];
    this.batch = [];

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Emit batch
    for (const handler of this.batchHandlers) {
      try {
        await handler(batchToSend);
      } catch (error) {
        this.stats.errors++;
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Also deliver individual messages if data handlers exist
    if (this.dataHandlers.length > 0) {
      for (const cell of batchToSend) {
        await this.deliverMessage(cell);
      }
    }
  }

  /**
   * Deliver message to handlers
   */
  private async deliverMessage(cell: BloodCell): Promise<void> {
    for (const handler of this.dataHandlers) {
      try {
        await handler(cell);
      } catch (error) {
        this.stats.errors++;
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Check if we can send (rate limiting)
   */
  private canSend(): boolean {
    if (this.options.maxRate === Infinity) {
      return true;
    }

    const now = Date.now();
    const windowStart = now - 1000; // 1 second window

    // Clean old timestamps
    this.messageTimestamps = this.messageTimestamps.filter((ts) => ts > windowStart);

    // Check burst tokens
    if (this.burstTokens > 0) {
      this.burstTokens--;
      return true;
    }

    // Check rate limit
    if (this.messageTimestamps.length < this.options.maxRate) {
      return true;
    }

    // Refill burst tokens gradually
    if (this.options.burstSize > 0) {
      const refillRate = this.options.burstSize / 10; // Refill over ~10 seconds
      this.burstTokens = Math.min(this.options.burstSize, this.burstTokens + refillRate * 0.1);
    }

    return false;
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(): void {
    const now = Date.now();
    const windowStart = now - 1000;

    const recentMessages = this.messageTimestamps.filter((ts) => ts > windowStart);
    this.stats.throughput = recentMessages.length;

    // Calculate average latency
    if (this.latencies.length > 0) {
      this.stats.avgLatency = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }
  }

  /**
   * Emit error
   */
  private emitError(error: Error): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch {
        // Ignore errors in error handlers
      }
    }
  }

  /**
   * Emit backpressure
   */
  private emitBackpressure(bufferSize: number): void {
    for (const handler of this.backpressureHandlers) {
      try {
        handler(bufferSize);
      } catch {
        // Ignore errors in backpressure handlers
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
