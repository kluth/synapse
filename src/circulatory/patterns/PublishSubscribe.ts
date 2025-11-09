import type { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';

/**
 * Subscriber callback
 */
type SubscriberCallback<TData = unknown> = (data: TData) => void | Promise<void>;

/**
 * PublishSubscribe - Publish-Subscribe messaging pattern
 *
 * Features:
 * - Broadcast messages to multiple subscribers
 * - Topic-based routing
 * - Wildcard subscriptions
 * - Error isolation (one subscriber error doesn't affect others)
 */
export class PublishSubscribe {
  private heart: Heart;

  constructor(heart: Heart) {
    this.heart = heart;
  }

  /**
   * Publish a message to a topic
   */
  public async publish<TData = unknown>(topic: string, data: TData): Promise<void> {
    const cell = new BloodCell(data, {
      type: 'Publish',
      metadata: { topic },
    });

    await this.heart.publish(`pubsub.${topic}`, cell);
  }

  /**
   * Subscribe to a topic
   */
  public subscribe<TData = unknown>(
    topic: string,
    callback: SubscriberCallback<TData>,
  ): () => void {
    return this.heart.subscribe(`pubsub.${topic}`, async (cell) => {
      try {
        await callback(cell.payload as TData);
      } catch {
        // Ignore subscriber errors to prevent affecting other subscribers
      }
    });
  }
}
