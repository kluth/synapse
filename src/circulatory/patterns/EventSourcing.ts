import type { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';

/**
 * Event
 */
export interface Event<TPayload = unknown> {
  id: string;
  streamId: string;
  type: string;
  payload: TPayload;
  timestamp: number;
}

/**
 * State reducer
 */
type StateReducer<T, TPayload = unknown> = (state: T, event: Event<TPayload>) => T;

/**
 * Event handler
 */
type EventHandler<TPayload = unknown> = (event: Event<TPayload>) => void | Promise<void>;

/**
 * Snapshot
 */
interface Snapshot<TState = unknown> {
  streamId: string;
  state: TState;
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
  private eventHandlers: Map<string, EventHandler<unknown>[]> = new Map();
  private snapshots: Map<string, Snapshot<unknown>> = new Map();

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
  public async append<TPayload = unknown>(
    streamId: string,
    type: string,
    payload: TPayload,
  ): Promise<void> {
    const cell = new BloodCell(payload, {
      type,
      metadata: { streamId },
    });

    await this.heart.publish(`es.${streamId}`, cell);
  }

  /**
   * Replay events from a stream
   */
  public async replay<TPayload = unknown>(streamId: string): Promise<Event<TPayload>[]> {
    const messages = await this.heart.getPersistedMessages(`es.${streamId}`);

    return messages.map((cell) => ({
      id: cell.id,
      streamId,
      type: cell.type!,
      payload: cell.payload as TPayload,
      timestamp: cell.timestamp,
    }));
  }

  /**
   * Rebuild state from events
   */
  public async rebuildState<T, TPayload = unknown>(
    streamId: string,
    reducer: StateReducer<T, TPayload>,
    initialState: T = {} as T,
  ): Promise<T> {
    const events = await this.replay<TPayload>(streamId);

    let state = initialState;

    for (const event of events) {
      state = reducer(state, event);
    }

    return state;
  }

  /**
   * Create snapshot of current state
   */
  public async createSnapshot<TState = unknown>(streamId: string, state: TState): Promise<void> {
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
  public async replayFromSnapshot<TPayload = unknown>(
    streamId: string,
  ): Promise<Event<TPayload>[]> {
    const snapshot = this.snapshots.get(streamId);

    if (!snapshot) {
      return this.replay<TPayload>(streamId);
    }

    const allEvents = await this.replay<TPayload>(streamId);

    // Return events after snapshot version
    return allEvents.slice(snapshot.version);
  }

  /**
   * Register event handler for projections
   */
  public onEvent<TPayload = unknown>(type: string, handler: EventHandler<TPayload>): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }

    this.eventHandlers.get(type)!.push(handler as EventHandler<unknown>);
  }

  /**
   * Handle incoming event
   */
  private async handleEvent(cell: BloodCell): Promise<void> {
    const event: Event<unknown> = {
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
