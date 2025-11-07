/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import type { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';

/**
 * Event
 */
export interface Event {
  id: string;
  streamId: string;
  type: string;
  payload: any;
  timestamp: number;
}

/**
 * State reducer
 */
type StateReducer<T> = (state: T, event: Event) => T;

/**
 * Event handler
 */
type EventHandler = (event: Event) => void | Promise<void>;

/**
 * Snapshot
 */
interface Snapshot {
  streamId: string;
  state: any;
  version: number;
  timestamp: number;
}

/**
 * EventSourcing - Event Sourcing pattern
 *
 * Features:
 * - Event append and replay
 * - State rebuilding from events
 * - Snapshots for performance
 * - Event projections
 */
export class EventSourcing {
  private heart: Heart;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private snapshots: Map<string, Snapshot> = new Map();

  constructor(heart: Heart) {
    this.heart = heart;

    // Subscribe to events
    this.heart.subscribe('es.*', async (cell) => {
      await this.handleEvent(cell);
    });
  }

  /**
   * Append event to stream
   */
  public async append(streamId: string, type: string, payload: any): Promise<void> {
    const cell = new BloodCell(payload, {
      type,
      metadata: { streamId },
    });

    await this.heart.publish(`es.${streamId}`, cell);
  }

  /**
   * Replay events from a stream
   */
  public async replay(streamId: string): Promise<Event[]> {
    const messages = await this.heart.getPersistedMessages(`es.${streamId}`);

    return messages.map((cell) => ({
      id: cell.id,
      streamId,
      type: cell.type!,
      payload: cell.payload,
      timestamp: cell.timestamp,
    }));
  }

  /**
   * Rebuild state from events
   */
  public async rebuildState<T>(
    streamId: string,
    reducer: StateReducer<T>,
    initialState: T = {} as T,
  ): Promise<T> {
    const events = await this.replay(streamId);

    let state = initialState;

    for (const event of events) {
      state = reducer(state, event);
    }

    return state;
  }

  /**
   * Create snapshot of current state
   */
  public async createSnapshot(streamId: string, state: any): Promise<void> {
    const events = await this.replay(streamId);

    this.snapshots.set(streamId, {
      streamId,
      state,
      version: events.length,
      timestamp: Date.now(),
    });
  }

  /**
   * Replay from snapshot
   */
  public async replayFromSnapshot(streamId: string): Promise<Event[]> {
    const snapshot = this.snapshots.get(streamId);

    if (!snapshot) {
      return this.replay(streamId);
    }

    const allEvents = await this.replay(streamId);

    // Return events after snapshot version
    return allEvents.slice(snapshot.version);
  }

  /**
   * Register event handler for projections
   */
  public onEvent(type: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }

    this.eventHandlers.get(type)!.push(handler);
  }

  /**
   * Handle incoming event
   */
  private async handleEvent(cell: BloodCell): Promise<void> {
    const event: Event = {
      id: cell.id,
      streamId: cell.metadata['streamId'] as string,
      type: cell.type!,
      payload: cell.payload,
      timestamp: cell.timestamp,
    };

    if (!this.eventHandlers.has(event.type)) {
      return;
    }

    const handlers = this.eventHandlers.get(event.type)!;

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }
}
