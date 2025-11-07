import { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';

/**
 * Subscriber callback
 */
type SubscriberCallback = (data: any) => void | Promise<void>;

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
  public async publish(topic: string, data: any): Promise<void> {
    const cell = new BloodCell(data, {
      type: 'Publish',
      metadata: { topic },
    });

    await this.heart.publish(`pubsub.${topic}`, cell);
  }

  /**
   * Subscribe to a topic
   */
  public subscribe(topic: string, callback: SubscriberCallback): () => void {
    return this.heart.subscribe(`pubsub.${topic}`, async (cell) => {
      try {
        await callback(cell.payload);
      } catch {
        // Ignore subscriber errors to prevent affecting other subscribers
      }
    });
  }
}
