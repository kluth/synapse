/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';

/**
 * Send options
 */
export interface SendOptions {
  priority?: number;
}

/**
 * Message handler
 */
type MessageHandler = (data: any) => void | Promise<void>;

/**
 * FireAndForget - Fire-and-Forget messaging pattern
 *
 * Features:
 * - One-way asynchronous messaging
 * - No response expected
 * - Non-blocking sends
 * - Priority support
 */
export class FireAndForget {
  private heart: Heart;
  private handlers: Map<string, MessageHandler[]> = new Map();

  constructor(heart: Heart) {
    this.heart = heart;

    // Subscribe to fire-and-forget topics
    this.heart.subscribe('faf.*', async (cell) => {
      await this.handleMessage(cell);
    });
  }

  /**
   * Send a fire-and-forget message
   */
  public async send(handler: string, data: any, options: SendOptions = {}): Promise<void> {
    const cell = new BloodCell(data, {
      type: 'FireAndForget',
      priority: options.priority ?? 0,
      metadata: { handler },
    });

    await this.heart.publish(`faf.${handler}`, cell);
  }

  /**
   * Register message handler
   */
  public onMessage(handler: string, callback: MessageHandler): void {
    if (!this.handlers.has(handler)) {
      this.handlers.set(handler, []);
    }

    this.handlers.get(handler)!.push(callback);
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(cell: BloodCell): Promise<void> {
    const handler = cell.metadata['handler'] as string;

    if (!this.handlers.has(handler)) {
      return;
    }

    const callbacks = this.handlers.get(handler)!;

    for (const callback of callbacks) {
      try {
        await callback(cell.payload);
      } catch {
        // Ignore errors in fire-and-forget
      }
    }
  }
}
