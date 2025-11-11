/**
 * Base class for all UI components in Synapse
 * Represents a "skin cell" that processes UI signals and renders output
 */

import { NeuralNode } from '../core/NeuralNode';
import type { Signal } from '../types';
import type {
  RenderSignal,
  UIEventSignal,
  StateSignal,
  SkinCellProps,
  SkinCellState,
} from './types';
import { EventEmitter } from 'events';

// Re-export SkinCellProps for external use
export type { SkinCellProps } from './types';

export interface SkinCellConfig<TProps extends SkinCellProps> {
  id: string;
  type: 'cortical' | 'reflex';
  threshold: number;
  props: TProps;
  initialState?: SkinCellState;
}

/**
 * SkinCell - Base class for all UI components
 *
 * Dendrites: Receive props and UI events
 * Soma: Process and determine what to render
 * Axon: Emit rendered output and events
 */
export abstract class SkinCell<
  TProps extends SkinCellProps = SkinCellProps,
  TState extends SkinCellState = SkinCellState,
> extends NeuralNode {
  // Receptive field - component props (inputs)
  protected receptiveField: TProps;

  // Visual state - component's internal state
  protected visualState: TState;

  // Render tracking
  protected renderCount: number = 0;
  protected lastRenderTime: number = 0;

  // Last fired timestamp for refractory period
  private lastFired: number = 0;

  // Event emitter for component events
  protected emitter: EventEmitter;

  constructor(config: SkinCellConfig<TProps>) {
    super({
      id: config.id,
      type: config.type,
      threshold: config.threshold,
    });

    this.receptiveField = config.props;
    this.visualState = (config.initialState ?? {}) as TState;
    this.emitter = new EventEmitter();
  }

  /**
   * Get current props (receptive field)
   */
  public getProps(): TProps {
    return { ...this.receptiveField };
  }

  /**
   * Update component props
   */
  public updateProps(partialProps: Partial<TProps>): void {
    const newProps = { ...this.receptiveField, ...partialProps };

    if (this.shouldUpdate(newProps)) {
      this.receptiveField = newProps;
      // Trigger re-render if needed
      this.requestRender();
    }
  }

  /**
   * Get current state
   */
  public getState(): TState {
    return { ...this.visualState };
  }

  /**
   * Update component state
   */
  public setState(partialState: Partial<TState>): void {
    const prevState = { ...this.visualState };
    this.visualState = { ...this.visualState, ...partialState };

    // Emit state update signal
    this.emitStateSignal(prevState, this.visualState);

    // Trigger re-render
    this.requestRender();
  }

  /**
   * Get render count
   */
  public getRenderCount(): number {
    return this.renderCount;
  }

  /**
   * Get last render timestamp
   */
  public getLastRenderTime(): number {
    return this.lastRenderTime;
  }

  /**
   * Emit UI event to connected neurons
   */
  protected emitUIEvent<T = unknown>(event: UIEventSignal<T>): void {
    // Convert to base Signal type for neural network transmission
    const baseSignal: Signal = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: 'excitatory',
      strength: event.strength,
      payload: event,
      timestamp: new Date(event.timestamp),
    };

    this.emit(baseSignal);
    // Also emit locally for component event listeners
    this.emitter.emit('signal', event);
  }

  /**
   * Emit state update signal
   */
  protected emitStateSignal(prevState: TState, newState: TState): void {
    const stateSignal: StateSignal = {
      type: 'state:update',
      data: {
        path: this.id,
        value: newState,
        prevValue: prevState,
      },
      strength: 1.0,
      timestamp: Date.now(),
    };

    // Convert to base Signal type
    const baseSignal: Signal = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: 'excitatory',
      strength: stateSignal.strength,
      payload: stateSignal,
      timestamp: new Date(stateSignal.timestamp),
    };

    this.emit(baseSignal);
    // Also emit locally
    this.emitter.emit('signal', stateSignal);
  }

  /**
   * Listen to component events
   */
  public on(event: string, listener: (...args: unknown[]) => void): void {
    this.emitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  public off(event: string, listener: (...args: unknown[]) => void): void {
    this.emitter.off(event, listener);
  }

  /**
   * Determine if component should update
   * Override this for custom update logic (similar to React's shouldComponentUpdate)
   */
  protected shouldUpdate(nextProps: TProps): boolean {
    // Check if any prop has changed (including functions)
    const currentKeys = Object.keys(this.receptiveField) as Array<keyof TProps>;
    const nextKeys = Object.keys(nextProps) as Array<keyof TProps>;

    // If key count differs, props changed
    if (currentKeys.length !== nextKeys.length) {
      return true;
    }

    // Check each prop for changes
    for (const key of nextKeys) {
      const currentValue = this.receptiveField[key];
      const nextValue = nextProps[key];

      // For functions, compare by reference
      if (typeof nextValue === 'function' || typeof currentValue === 'function') {
        if (currentValue !== nextValue) {
          return true;
        }
      }
      // For objects/arrays, use JSON comparison
      else if (typeof nextValue === 'object' && nextValue !== null) {
        if (JSON.stringify(currentValue) !== JSON.stringify(nextValue)) {
          return true;
        }
      }
      // For primitives, use strict equality
      else if (currentValue !== nextValue) {
        return true;
      }
    }

    return false;
  }

  /**
   * Request a re-render (batched/debounced in real implementation)
   */
  protected requestRender(): void {
    // In real implementation, this would batch updates
    // For now, we just track that a render was requested
  }

  /**
   * Render the component (Axon output)
   */
  public render(): RenderSignal {
    this.trackRender();
    return this.performRender();
  }

  /**
   * Track render execution
   */
  protected trackRender(): void {
    this.renderCount++;
    this.lastRenderTime = Date.now();
  }

  /**
   * Actual render implementation - must be overridden by subclasses
   */
  protected abstract performRender(): RenderSignal;

  /**
   * Get refractory period for this neuron (debouncing)
   * Override to customize
   */
  protected getRefractoryPeriod(): number {
    return 16; // Default 16ms (one frame at 60fps)
  }

  /**
   * Lifecycle: Component mounted
   */
  protected async onMount(): Promise<void> {
    // Override in subclasses for mount logic
  }

  /**
   * Lifecycle: Component will unmount
   */
  protected async onUnmount(): Promise<void> {
    // Override in subclasses for cleanup
  }

  /**
   * Override activate to call onMount
   */
  public override async activate(): Promise<void> {
    await super.activate();
    await this.onMount();
  }

  /**
   * Override deactivate to call onUnmount
   */
  public override async deactivate(): Promise<void> {
    await this.onUnmount();
    await super.deactivate();
  }

  /**
   * Override receive to process UI signals immediately
   * UI components need immediate feedback, but still respect threshold and refractory period
   */
  public override async receive(signal: Signal): Promise<void> {
    if (this.state !== 'active' && this.state !== 'firing') {
      throw new Error('Node is not active');
    }

    // Check refractory period
    const refractoryPeriod = this.getRefractoryPeriod();
    const now = Date.now();
    const timeSinceLastFire = now - this.lastFired;
    if (refractoryPeriod > 0 && timeSinceLastFire < refractoryPeriod) {
      return; // Ignore signal during refractory period
    }

    // Check threshold
    if (signal.strength < this.threshold) {
      return; // Signal too weak to trigger processing
    }

    // For UI components, process signals immediately
    // Extract the actual UI signal from the payload if it's wrapped
    const uiSignal = signal.payload ?? signal;

    try {
      this.lastFired = now;
      await this.executeProcessing({ data: uiSignal });
    } catch (error) {
      console.error(`Error processing signal in ${this.id}:`, error);
    }
  }
}
