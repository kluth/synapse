import { BloodCell } from './BloodCell';
import { EventEmitter } from 'events';

/**
 * Vein options
 */
export interface VeinOptions {
  maxBufferSize?: number;
  autoAck?: boolean;
  ackTimeout?: number; // Milliseconds
  batchSize?: number;
  batchTimeout?: number; // Milliseconds
  pullMode?: boolean;
  priorityMode?: boolean;
}

/**
 * Stream statistics
 */
export interface VeinStats {
  received: number;
  processed: number;
  acknowledged: number;
  errors: number;
  dropped: number;
  throughput: number; // Messages per second
}

/**
 * Message handler callback
 */
type MessageHandler = (cell: BloodCell) => void | Promise<void>;

/**
 * Batch handler callback
 */
type BatchHandler = (cells: BloodCell[]) => void | Promise<void>;

/**
 * Error handler callback
 */
type ErrorHandler = (error: Error) => void;

/**
 * Acknowledge handler callback
 */
type AcknowledgeHandler = (cell: BloodCell) => void;

/**
 * Buffer full handler callback
 */
type BufferFullHandler = (size: number) => void;

/**
 * Pending message (waiting for acknowledgment)
 */
interface PendingMessage {
  cell: BloodCell;
  receivedAt: number;
  retries: number;
}

/**
 * Vein - Inbound data stream with acknowledgment and batch processing
 *
 * Features:
 * - Message acknowledgment (auto/manual)
 * - Batch processing (by size or time)
 * - Pull-based consumption
 * - Buffering with capacity limits
 * - Error handling
 * - Statistics tracking
 * - Consumer groups
 * - Message ordering (FIFO or priority)
 */
export class Vein extends EventEmitter {
  public readonly name: string;
  private options: Required<VeinOptions>;
  private active = false;
  private buffer: BloodCell[] = [];
  private batch: BloodCell[] = [];
  private batchTimer?: NodeJS.Timeout;
  private processingLoop?: NodeJS.Timeout;
  private ackCheckLoop?: NodeJS.Timeout;

  // Pending acknowledgments
  private pendingAcks: Map<string, PendingMessage> = new Map();

  // Handlers
  private messageHandlers: MessageHandler[] = [];
  private batchHandlers: BatchHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private acknowledgeHandlers: AcknowledgeHandler[] = [];
  private bufferFullHandlers: BufferFullHandler[] = [];

  // Statistics
  private stats: VeinStats = {
    received: 0,
    processed: 0,
    acknowledged: 0,
    errors: 0,
    dropped: 0,
    throughput: 0,
  };

  private messageTimestamps: number[] = [];

  constructor(name: string, options: VeinOptions = {}) {
    super();
    this.name = name;
    this.options = {
      maxBufferSize: options.maxBufferSize ?? 1000,
      autoAck: options.autoAck ?? true,
      ackTimeout: options.ackTimeout ?? 30000, // 30 seconds
      batchSize: options.batchSize ?? 0,
      batchTimeout: options.batchTimeout ?? 0,
      pullMode: options.pullMode ?? false,
      priorityMode: options.priorityMode ?? false,
    };
  }

  /**
   * Check if stream is active
   */
  public isActive(): boolean {
    return this.active;
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
  public async start(): Promise<void> {
    if (this.active) {
      return;
    }

    this.active = true;

    if (!this.options.pullMode) {
      this.startProcessing();
    }

    if (!this.options.autoAck) {
      this.startAckCheck();
    }
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
    if (this.ackCheckLoop) {
      clearTimeout(this.ackCheckLoop);
    }

    // Process remaining messages
    if (!this.options.pullMode) {
      while (this.buffer.length > 0) {
        await this.processMessage();
        await this.sleep(1);
      }
    }

    // Flush remaining batch
    if (this.batch.length > 0) {
      await this.flushBatch();
    }
  }

  /**
   * Receive a message
   */
  public async receive(cell: BloodCell): Promise<void> {
    if (!this.active) {
      throw new Error('Vein is not active');
    }

    // Check buffer capacity
    if (this.buffer.length >= this.options.maxBufferSize) {
      this.stats.dropped++;
      this.emitBufferFull(this.buffer.length);
      throw new Error('Buffer full');
    }

    this.stats.received++;
    this.messageTimestamps.push(Date.now());

    // Add to buffer
    this.buffer.push(cell);

    // Sort by priority if enabled
    if (this.options.priorityMode) {
      this.sortBuffer();
    }

    // Always track for acknowledgment (needed for stats and manual mode)
    this.pendingAcks.set(cell.id, {
      cell,
      receivedAt: Date.now(),
      retries: 0,
    });
  }

  /**
   * Pull a single message (pull mode)
   */
  public async pull(): Promise<BloodCell | null> {
    if (!this.options.pullMode) {
      throw new Error('Vein is not in pull mode');
    }

    if (this.buffer.length === 0) {
      return null;
    }

    const cell = this.buffer.shift()!;
    this.stats.processed++;

    return cell;
  }

  /**
   * Pull a batch of messages (pull mode)
   */
  public async pullBatch(size: number): Promise<BloodCell[]> {
    if (!this.options.pullMode) {
      throw new Error('Vein is not in pull mode');
    }

    const batch: BloodCell[] = [];

    for (let i = 0; i < size && this.buffer.length > 0; i++) {
      const cell = this.buffer.shift()!;
      batch.push(cell);
      this.stats.processed++;
    }

    return batch;
  }

  /**
   * Acknowledge a message
   */
  public async acknowledge(cell: BloodCell): Promise<void> {
    if (this.pendingAcks.has(cell.id)) {
      this.pendingAcks.delete(cell.id);

      // Mark as acknowledged if not already
      if (!cell.isAcknowledged()) {
        cell.acknowledge();
      }

      this.stats.acknowledged++;

      for (const handler of this.acknowledgeHandlers) {
        try {
          handler(cell);
        } catch {
          // Ignore errors in handlers
        }
      }
    } else if (cell.isAcknowledged()) {
      // Cell was acknowledged directly - still count it
      this.stats.acknowledged++;

      for (const handler of this.acknowledgeHandlers) {
        try {
          handler(cell);
        } catch {
          // Ignore errors in handlers
        }
      }
    }
  }

  /**
   * Acknowledge a batch of messages
   */
  public async acknowledgeBatch(cells: BloodCell[]): Promise<void> {
    for (const cell of cells) {
      await this.acknowledge(cell);
    }
  }

  /**
   * Register message handler
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
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
   * Register acknowledge handler
   */
  public onAcknowledge(handler: AcknowledgeHandler): () => void {
    this.acknowledgeHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.acknowledgeHandlers.indexOf(handler);
      if (index > -1) {
        this.acknowledgeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register buffer full handler
   */
  public onBufferFull(handler: BufferFullHandler): () => void {
    this.bufferFullHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.bufferFullHandlers.indexOf(handler);
      if (index > -1) {
        this.bufferFullHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get statistics
   */
  public getStats(): VeinStats {
    this.calculateThroughput();
    return { ...this.stats };
  }

  /**
   * Start processing loop
   */
  private startProcessing(): void {
    this.processingLoop = setTimeout(() => this.processLoop(), 0);
  }

  /**
   * Processing loop
   */
  private async processLoop(): Promise<void> {
    if (!this.active) {
      return;
    }

    while (this.buffer.length > 0 && this.active) {
      await this.processMessage();
    }

    // Calculate throughput
    this.calculateThroughput();

    // Continue loop
    if (this.active) {
      this.processingLoop = setTimeout(() => this.processLoop(), 10);
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

    try {
      // Handle batching
      if (this.options.batchSize > 0 || this.options.batchTimeout > 0) {
        this.addToBatch(cell);
      } else {
        // Deliver immediately
        await this.deliverMessage(cell);

        // Auto-acknowledge
        if (this.options.autoAck) {
          await this.acknowledge(cell);
        }
      }

      this.stats.processed++;
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
      this.flushBatch();
      return;
    }

    // Start timeout-based batching
    if (this.options.batchTimeout > 0 && !this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
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

    // Also deliver individual messages if message handlers exist
    if (this.messageHandlers.length > 0 && this.batchHandlers.length === 0) {
      for (const cell of batchToSend) {
        await this.deliverMessage(cell);

        // Auto-acknowledge
        if (this.options.autoAck) {
          await this.acknowledge(cell);
        }
      }
    }
  }

  /**
   * Deliver message to handlers
   */
  private async deliverMessage(cell: BloodCell): Promise<void> {
    for (const handler of this.messageHandlers) {
      try {
        await handler(cell);
      } catch (error) {
        this.stats.errors++;
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Start acknowledgment check loop
   */
  private startAckCheck(): void {
    this.ackCheckLoop = setTimeout(() => this.checkAcks(), this.options.ackTimeout / 2);
  }

  /**
   * Check for unacknowledged messages
   */
  private async checkAcks(): Promise<void> {
    if (!this.active) {
      return;
    }

    const now = Date.now();

    for (const [id, pending] of this.pendingAcks.entries()) {
      // Check if acknowledged directly on cell
      if (pending.cell.isAcknowledged()) {
        this.pendingAcks.delete(id);
        this.stats.acknowledged++;

        for (const handler of this.acknowledgeHandlers) {
          try {
            handler(pending.cell);
          } catch {
            // Ignore errors in handlers
          }
        }
        continue;
      }

      const elapsed = now - pending.receivedAt;

      if (elapsed > this.options.ackTimeout) {
        // Timeout - retry message
        this.pendingAcks.delete(id);
        pending.retries++;

        // Re-add to buffer
        this.buffer.unshift(pending.cell);
      }
    }

    // Continue check loop
    if (this.active) {
      this.ackCheckLoop = setTimeout(() => this.checkAcks(), this.options.ackTimeout / 2);
    }
  }

  /**
   * Sort buffer by priority
   */
  private sortBuffer(): void {
    this.buffer.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // FIFO for same priority
    });
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(): void {
    const now = Date.now();
    const windowStart = now - 1000;

    const recentMessages = this.messageTimestamps.filter(ts => ts > windowStart);
    this.stats.throughput = recentMessages.length;

    // Clean old timestamps
    this.messageTimestamps = recentMessages;
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
   * Emit buffer full
   */
  private emitBufferFull(size: number): void {
    for (const handler of this.bufferFullHandlers) {
      try {
        handler(size);
      } catch {
        // Ignore errors in handlers
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
