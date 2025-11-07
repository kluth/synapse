/**
 * Instrument - Base interface for Theater tools
 *
 * Instruments are development tools that can be attached to the Theater
 * to provide additional functionality (debugging, monitoring, testing, etc.).
 *
 * Examples: Microscope, SignalTracer, StateExplorer, PerformanceProfiler
 */

import { EventEmitter } from 'events';

/**
 * Instrument state
 */
export type InstrumentState = 'inactive' | 'active' | 'minimized';

/**
 * Instrument panel position
 */
export type InstrumentPosition = 'left' | 'right' | 'bottom' | 'floating';

/**
 * Instrument configuration
 */
export interface InstrumentConfig {
  /**
   * Unique instrument ID
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Icon (emoji or SVG)
   */
  icon?: string;

  /**
   * Default position
   */
  defaultPosition?: InstrumentPosition;

  /**
   * Default state
   */
  defaultState?: InstrumentState;

  /**
   * Keyboard shortcut
   */
  shortcut?: string;

  /**
   * Instrument priority (for ordering)
   */
  priority?: number;
}

/**
 * Instrument data that can be stored/restored
 */
export interface InstrumentData {
  [key: string]: unknown;
}

/**
 * Base Instrument interface
 */
export abstract class Instrument extends EventEmitter {
  public readonly id: string;
  public readonly name: string;
  public readonly icon: string;
  public readonly shortcut?: string;
  public readonly priority: number;

  protected state: InstrumentState;
  protected position: InstrumentPosition;
  protected data: InstrumentData;

  constructor(config: InstrumentConfig) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.icon = config.icon ?? '🔬';
    if (config.shortcut !== undefined) {
      this.shortcut = config.shortcut;
    }
    this.priority = config.priority ?? 0;
    this.state = config.defaultState ?? 'inactive';
    this.position = config.defaultPosition ?? 'right';
    this.data = {};
  }

  /**
   * Initialize the instrument
   */
  public abstract initialize(): Promise<void>;

  /**
   * Cleanup the instrument
   */
  public abstract cleanup(): Promise<void>;

  /**
   * Render the instrument UI
   */
  public abstract render(): string;

  /**
   * Open the instrument panel
   */
  public open(): void {
    this.state = 'active';
    this.emit('state:change', { state: this.state });
  }

  /**
   * Close the instrument panel
   */
  public close(): void {
    this.state = 'inactive';
    this.emit('state:change', { state: this.state });
  }

  /**
   * Toggle instrument panel
   */
  public toggle(): void {
    if (this.state === 'active') {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Minimize instrument panel
   */
  public minimize(): void {
    this.state = 'minimized';
    this.emit('state:change', { state: this.state });
  }

  /**
   * Set instrument position
   */
  public setPosition(position: InstrumentPosition): void {
    this.position = position;
    this.emit('position:change', { position });
  }

  /**
   * Get current state
   */
  public getState(): InstrumentState {
    return this.state;
  }

  /**
   * Get current position
   */
  public getPosition(): InstrumentPosition {
    return this.position;
  }

  /**
   * Store data
   */
  public setData(key: string, value: unknown): void {
    this.data[key] = value;
    this.emit('data:change', { key, value });
  }

  /**
   * Retrieve data
   */
  public getData(key: string): unknown {
    return this.data[key];
  }

  /**
   * Get all data
   */
  public getAllData(): InstrumentData {
    return { ...this.data };
  }

  /**
   * Clear all data
   */
  public clearData(): void {
    this.data = {};
    this.emit('data:clear');
  }

  /**
   * Export instrument state (for persistence)
   */
  public exportState(): {
    state: InstrumentState;
    position: InstrumentPosition;
    data: InstrumentData;
  } {
    return {
      state: this.state,
      position: this.position,
      data: { ...this.data },
    };
  }

  /**
   * Import instrument state (for restoration)
   */
  public importState(exported: {
    state?: InstrumentState;
    position?: InstrumentPosition;
    data?: InstrumentData;
  }): void {
    if (exported.state !== undefined) {
      this.state = exported.state;
    }
    if (exported.position !== undefined) {
      this.position = exported.position;
    }
    if (exported.data !== undefined) {
      this.data = { ...exported.data };
    }
    this.emit('state:import');
  }
}
