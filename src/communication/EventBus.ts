import type { z } from 'zod';

type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

interface SubscriptionOptions {
  schema?: z.ZodSchema;
}

interface EventBusConfig {
  historySize?: number;
}

interface EventBusStats {
  totalEmitted: number;
  eventCounts: Record<string, number>;
  subscriberCounts: Record<string, number>;
}

interface StoredEvent {
  type: string;
  data: unknown;
  timestamp: Date;
}

/**
 * EventBus - Pub-Sub Communication System
 *
 * Provides strongly-typed event broadcasting for neuron-to-neuron communication.
 * Supports:
 * - Pattern matching (wildcards)
 * - Schema validation with Zod
 * - Async event handlers
 * - Event history tracking
 * - Statistics and monitoring
 */
export class EventBus {
  private handlers: Map<
    string,
    Array<{ handler: EventHandler; schema?: z.ZodSchema; once?: boolean }>
  > = new Map();
  private history: StoredEvent[] = [];
  private readonly historySize: number;

  // Statistics
  private totalEmitted = 0;
  private eventCounts: Map<string, number> = new Map();

  constructor(config?: EventBusConfig) {
    this.historySize = config?.historySize ?? 0;
  }

  /**
   * Subscribe to an event
   */
  public on<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions,
  ): () => void {
    const handlers = this.handlers.get(eventType) ?? [];
    const subscription: { handler: EventHandler; schema?: z.ZodSchema; once?: boolean } = {
      handler: handler as EventHandler,
    };

    if (options?.schema !== undefined) {
      subscription.schema = options.schema;
    }

    handlers.push(subscription);
    this.handlers.set(eventType, handlers);

    // Return unsubscribe function
    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * Subscribe to an event for one-time execution
   */
  public once<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscriptionOptions,
  ): () => void {
    const handlers = this.handlers.get(eventType) ?? [];
    const subscription: { handler: EventHandler; schema?: z.ZodSchema; once?: boolean } = {
      handler: handler as EventHandler,
      once: true,
    };

    if (options?.schema !== undefined) {
      subscription.schema = options.schema;
    }

    handlers.push(subscription);
    this.handlers.set(eventType, handlers);

    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * Unsubscribe from an event
   */
  public off<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);

    if (handlers === undefined) {
      return;
    }

    const filtered = handlers.filter((h) => h.handler !== handler);
    this.handlers.set(eventType, filtered);

    if (filtered.length === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  public async emit<T = unknown>(eventType: string, data: T): Promise<void> {
    // Update statistics
    this.totalEmitted++;
    this.eventCounts.set(eventType, (this.eventCounts.get(eventType) ?? 0) + 1);

    // Store in history
    if (this.historySize > 0) {
      this.history.push({
        type: eventType,
        data,
        timestamp: new Date(),
      });

      // Limit history size
      if (this.history.length > this.historySize) {
        this.history.shift();
      }
    }

    // Get matching handlers (exact match + wildcards)
    const matchingHandlers = this.getMatchingHandlers(eventType);

    if (matchingHandlers.length === 0) {
      return;
    }

    // Validate all schemas first before executing any handlers
    for (const subscription of matchingHandlers) {
      if (subscription.schema !== undefined) {
        subscription.schema.parse(data); // This will throw if invalid
      }
    }

    // Execute all handlers (catch errors to not stop other handlers)
    const promises = matchingHandlers.map(async (subscription) => {
      try {
        await subscription.handler(data);
      } catch (error) {
        // Log error but don't stop other handlers
        console.error(`Error in event handler for ${eventType}:`, error);
        // Don't rethrow - let other handlers continue
      }
    });

    await Promise.all(promises);

    // Remove one-time handlers
    for (const [type, handlers] of this.handlers.entries()) {
      const filtered = handlers.filter((h) => {
        if (h.once === true && matchingHandlers.includes(h)) {
          return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        this.handlers.delete(type);
      } else {
        this.handlers.set(type, filtered);
      }
    }
  }

  /**
   * Get event history
   */
  public getHistory(): readonly StoredEvent[] {
    return [...this.history];
  }

  /**
   * Get statistics
   */
  public getStats(): EventBusStats {
    const subscriberCounts: Record<string, number> = {};

    for (const [eventType, handlers] of this.handlers.entries()) {
      subscriberCounts[eventType] = handlers.length;
    }

    return {
      totalEmitted: this.totalEmitted,
      eventCounts: Object.fromEntries(this.eventCounts),
      subscriberCounts,
    };
  }

  /**
   * Clear all subscriptions and history
   */
  public clear(): void {
    this.handlers.clear();
    this.history = [];
    this.totalEmitted = 0;
    this.eventCounts.clear();
  }

  /**
   * Get handlers matching an event type (including wildcards)
   */
  private getMatchingHandlers(
    eventType: string,
  ): Array<{ handler: EventHandler; schema?: z.ZodSchema; once?: boolean }> {
    const matching: Array<{ handler: EventHandler; schema?: z.ZodSchema; once?: boolean }> = [];

    for (const [pattern, handlers] of this.handlers.entries()) {
      if (this.matchesPattern(eventType, pattern)) {
        matching.push(...handlers);
      }
    }

    return matching;
  }

  /**
   * Check if event type matches a pattern (supports wildcards)
   */
  private matchesPattern(eventType: string, pattern: string): boolean {
    // Exact match
    if (eventType === pattern) {
      return true;
    }

    // Wildcard matching
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '[^:]*') + '$');
      return regex.test(eventType);
    }

    return false;
  }
}
