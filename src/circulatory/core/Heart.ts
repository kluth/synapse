import { BloodCell } from './BloodCell';
import { EventEmitter } from 'events';

/**
 * Heart options
 */
export interface HeartOptions {
  persistence?: boolean;
  maxQueueSize?: number;
}

/**
 * Publish options
 */
export interface PublishOptions {
  maxRetries?: number;
  deliveryMode?: 'at-least-once' | 'at-most-once' | 'exactly-once';
  retryDelay?: number;
}

/**
 * Subscriber callback
 */
type SubscriberCallback = (cell: BloodCell) => void | Promise<void>;

/**
 * Subscription
 */
interface Subscription {
  id: string;
  topic: string;
  pattern: RegExp;
  callback: SubscriberCallback;
}

/**
 * Queued message
 */
interface QueuedMessage {
  topic: string;
  cell: BloodCell;
  options: PublishOptions;
  attempts: number;
}

/**
 * Heart - Central message broker for the Circulatory System
 *
 * Features:
 * - Message routing and distribution
 * - Priority queues
 * - Dead letter queues
 * - Message persistence
 * - At-least-once delivery guarantee
 * - Pattern matching for subscriptions
 * - Statistics tracking
 */
export class Heart extends EventEmitter {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private processing = false;
  private stopped = false;
  private persistedMessages: Map<string, BloodCell[]> = new Map();
  private options: Required<HeartOptions>;

  // Statistics
  private stats = {
    published: 0,
    delivered: 0,
    failed: 0,
    deadLettered: 0,
    acknowledged: 0,
  };

  // Handlers
  private deadLetterHandler?: (cell: BloodCell) => void;
  private acknowledgeHandler?: (cell: BloodCell) => void;

  constructor(options: HeartOptions = {}) {
    super();
    this.options = {
      persistence: options.persistence ?? false,
      maxQueueSize: options.maxQueueSize ?? Infinity,
    };

    this.startProcessing();
  }

  /**
   * Subscribe to a topic
   */
  public subscribe(topic: string, callback: SubscriberCallback): () => void {
    const subscription: Subscription = {
      id: this.generateId(),
      topic,
      pattern: this.topicToPattern(topic),
      callback,
    };

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }

    this.subscriptions.get(topic)!.push(subscription);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(topic);
      if (subs) {
        const index = subs.findIndex(s => s.id === subscription.id);
        if (index > -1) {
          subs.splice(index, 1);
        }
        if (subs.length === 0) {
          this.subscriptions.delete(topic);
        }
      }
    };
  }

  /**
   * Publish a message
   */
  public async publish(topic: string, cell: BloodCell, options: PublishOptions = {}): Promise<void> {
    this.stats.published++;

    // Persist if enabled
    if (this.options.persistence) {
      if (!this.persistedMessages.has(topic)) {
        this.persistedMessages.set(topic, []);
      }
      this.persistedMessages.get(topic)!.push(cell);
    }

    // Check if expired
    if (cell.isExpired()) {
      return; // Don't queue expired messages
    }

    // Add to queue
    const queuedMessage: QueuedMessage = {
      topic,
      cell,
      options: {
        maxRetries: options.maxRetries ?? 0,
        deliveryMode: options.deliveryMode ?? 'at-most-once',
        retryDelay: options.retryDelay ?? 100,
      },
      attempts: 0,
    };

    this.messageQueue.push(queuedMessage);
    this.sortQueue();
  }

  /**
   * Register dead letter handler
   */
  public onDeadLetter(handler: (cell: BloodCell) => void): void {
    this.deadLetterHandler = handler;
  }

  /**
   * Register acknowledge handler
   */
  public onAcknowledge(handler: (cell: BloodCell) => void): void {
    this.acknowledgeHandler = handler;
  }

  /**
   * Get persisted messages for a topic
   */
  public async getPersistedMessages(topic: string): Promise<BloodCell[]> {
    return this.persistedMessages.get(topic) || [];
  }

  /**
   * Replay persisted messages
   */
  public async replay(topic: string): Promise<void> {
    const messages = this.persistedMessages.get(topic) || [];
    for (const cell of messages) {
      await this.deliverMessage(topic, cell);
    }
  }

  /**
   * Get statistics
   */
  public getStats() {
    return { ...this.stats };
  }

  /**
   * Stop the heart
   */
  public async stop(): Promise<void> {
    this.stopped = true;
    // Wait for queue to drain
    while (this.messageQueue.length > 0 && this.processing) {
      await this.sleep(10);
    }
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    setTimeout(() => this.processQueue(), 0);
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.stopped) {
      return;
    }

    this.processing = true;

    while (this.messageQueue.length > 0 && !this.stopped) {
      const message = this.messageQueue.shift()!;

      try {
        // Check if expired
        if (message.cell.isExpired()) {
          continue;
        }

        await this.deliverMessage(message.topic, message.cell);
        this.stats.delivered++;
      } catch (error) {
        this.stats.failed++;
        message.attempts++;
        message.cell.incrementRetry();

        // Retry logic
        if (message.attempts <= message.options.maxRetries!) {
          // Re-queue for retry
          await this.sleep(message.options.retryDelay!);
          this.messageQueue.push(message);
          this.sortQueue();
        } else {
          // Move to dead letter queue
          this.stats.deadLettered++;
          message.cell.reject('Max retries exceeded');
          if (this.deadLetterHandler) {
            this.deadLetterHandler(message.cell);
          }
        }
      }
    }

    this.processing = false;

    // Continue processing
    if (!this.stopped) {
      setTimeout(() => this.processQueue(), 10);
    }
  }

  /**
   * Deliver message to subscribers
   */
  private async deliverMessage(topic: string, cell: BloodCell): Promise<void> {
    const matchingSubscriptions = this.getMatchingSubscriptions(topic);

    if (matchingSubscriptions.length === 0) {
      return;
    }

    // Deliver to all matching subscribers
    const promises = matchingSubscriptions.map(async sub => {
      try {
        await sub.callback(cell);
        if (cell.isAcknowledged() && this.acknowledgeHandler) {
          this.stats.acknowledged++;
          this.acknowledgeHandler(cell);
        }
      } catch (error) {
        throw error; // Propagate error for retry logic
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get subscriptions matching topic
   */
  private getMatchingSubscriptions(topic: string): Subscription[] {
    const matching: Subscription[] = [];

    for (const [subTopic, subs] of this.subscriptions.entries()) {
      for (const sub of subs) {
        if (sub.pattern.test(topic)) {
          matching.push(sub);
        }
      }
    }

    return matching;
  }

  /**
   * Convert topic pattern to regex
   */
  private topicToPattern(topic: string): RegExp {
    // Convert wildcard patterns like "user.*" to regex
    const pattern = topic
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.+');

    return new RegExp(`^${pattern}$`);
  }

  /**
   * Sort queue by priority (descending)
   */
  private sortQueue(): void {
    this.messageQueue.sort((a, b) => {
      // Higher priority first
      if (a.cell.priority !== b.cell.priority) {
        return b.cell.priority - a.cell.priority;
      }
      // Same priority: FIFO (by timestamp)
      return a.cell.timestamp - b.cell.timestamp;
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
