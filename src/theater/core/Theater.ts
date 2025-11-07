/**
 * Theater - The Anatomy Theater orchestrator
 *
 * The main Theater class that coordinates the Stage, Amphitheater,
 * and Instruments to provide a complete component development and
 * documentation experience.
 */

import { EventEmitter } from 'events';
import type { TheaterConfig } from './TheaterConfig';
import { DEFAULT_THEATER_CONFIG } from './TheaterConfig';
import { Stage } from './Stage';
import { Amphitheater } from './Amphitheater';
import type { Instrument } from './Instrument';

/**
 * Theater lifecycle state
 */
export type TheaterState = 'stopped' | 'starting' | 'running' | 'stopping';

/**
 * Theater event types
 */
export interface TheaterEvents {
  'state:change': { state: TheaterState };
  'config:update': { config: TheaterConfig };
  'instrument:registered': { instrument: Instrument };
  'instrument:unregistered': { id: string };
  error: { error: Error; context: string };
}

/**
 * Theater - Main orchestrator
 */
export class Theater extends EventEmitter {
  private config: Required<TheaterConfig>;
  private state: TheaterState = 'stopped';

  public readonly stage: Stage;
  public readonly amphitheater: Amphitheater;
  private instruments: Map<string, Instrument> = new Map();

  constructor(config: TheaterConfig) {
    super();

    // Merge with defaults
    this.config = {
      ...DEFAULT_THEATER_CONFIG,
      ...config,
      theme: {
        ...DEFAULT_THEATER_CONFIG.theme,
        ...config.theme,
      },
    };

    // Initialize core components
    this.stage = new Stage({
      isolation: 'iframe',
      viewport: { width: 1920, height: 1080 },
      responsive: true,
      screenshots: true,
    });

    this.amphitheater = new Amphitheater({
      theme: this.config.darkMode ? 'dark' : 'light',
      layout: 'grid',
      search: true,
      keyboardNav: true,
    });

    this.setupEventListeners();
  }

  /**
   * Start the theater
   */
  public async start(): Promise<void> {
    if (this.state === 'running') {
      return;
    }

    this.setState('starting');

    try {
      // Initialize amphitheater
      await this.amphitheater.initialize();

      // Initialize instruments
      for (const instrument of this.instruments.values()) {
        await instrument.initialize();
      }

      this.setState('running');
      this.emit('started');
    } catch (error) {
      this.setState('stopped');
      this.emitError(error as Error, 'start');
      throw error;
    }
  }

  /**
   * Stop the theater
   */
  public async stop(): Promise<void> {
    if (this.state === 'stopped') {
      return;
    }

    this.setState('stopping');

    try {
      // Cleanup instruments
      for (const instrument of this.instruments.values()) {
        await instrument.cleanup();
      }

      // Cleanup stage
      await this.stage.cleanup();

      // Cleanup amphitheater
      await this.amphitheater.cleanup();

      this.setState('stopped');
      this.emit('stopped');
    } catch (error) {
      this.emitError(error as Error, 'stop');
      throw error;
    }
  }

  /**
   * Reload the theater
   */
  public async reload(): Promise<void> {
    await this.stop();
    await this.start();
    this.emit('reloaded');
  }

  /**
   * Register an instrument
   */
  public registerInstrument(instrument: Instrument): void {
    if (this.instruments.has(instrument.id)) {
      throw new Error(`Instrument already registered: ${instrument.id}`);
    }

    this.instruments.set(instrument.id, instrument);
    this.emit('instrument:registered', { instrument });

    // Initialize if theater is already running
    if (this.state === 'running') {
      instrument.initialize().catch((error) => {
        this.emitError(error as Error, 'instrument:initialize');
      });
    }
  }

  /**
   * Unregister an instrument
   */
  public async unregisterInstrument(id: string): Promise<void> {
    const instrument = this.instruments.get(id);
    if (instrument === undefined) {
      return;
    }

    await instrument.cleanup();
    this.instruments.delete(id);
    this.emit('instrument:unregistered', { id });
  }

  /**
   * Get instrument by ID
   */
  public getInstrument(id: string): Instrument | undefined {
    return this.instruments.get(id);
  }

  /**
   * Get all instruments
   */
  public getInstruments(): Instrument[] {
    return Array.from(this.instruments.values());
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<TheaterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      theme: {
        ...this.config.theme,
        ...config.theme,
      },
    };

    this.emit('config:update', { config: this.config });

    // Apply theme change
    if (config.darkMode !== undefined) {
      this.amphitheater.setTheme(config.darkMode ? 'dark' : 'light');
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<TheaterConfig> {
    return { ...this.config };
  }

  /**
   * Get current state
   */
  public getState(): TheaterState {
    return this.state;
  }

  /**
   * Check if theater is running
   */
  public isRunning(): boolean {
    return this.state === 'running';
  }

  /**
   * Get theater statistics
   */
  public getStats(): {
    state: TheaterState;
    config: Required<TheaterConfig>;
    instruments: number;
    amphitheaterStats: ReturnType<Amphitheater['getStats']>;
    stageStats: ReturnType<Stage['getStats']>;
  } {
    return {
      state: this.state,
      config: this.getConfig(),
      instruments: this.instruments.size,
      amphitheaterStats: this.amphitheater.getStats(),
      stageStats: this.stage.getStats(),
    };
  }

  /**
   * Enable hot reload
   */
  public enableHotReload(): void {
    this.config.hotReload = true;
    // Would setup file watchers and HMR in real implementation
  }

  /**
   * Disable hot reload
   */
  public disableHotReload(): void {
    this.config.hotReload = false;
  }

  /**
   * Set state
   */
  private setState(state: TheaterState): void {
    if (this.state === state) {
      return;
    }

    this.state = state;
    this.emit('state:change', { state });
  }

  /**
   * Setup event listeners for core components
   */
  private setupEventListeners(): void {
    // Stage events
    this.stage.on('mounted', (data) => {
      this.emit('stage:mounted', data);
    });

    this.stage.on('unmounted', (data) => {
      this.emit('stage:unmounted', data);
    });

    // Amphitheater events
    this.amphitheater.on('specimen:selected', (data) => {
      this.emit('specimen:selected', data);
    });

    this.amphitheater.on('filter:change', (data) => {
      this.emit('filter:change', data);
    });
  }

  /**
   * Emit error event
   */
  private emitError(error: Error, context: string): void {
    this.emit('error', { error, context });
  }

  /**
   * Cleanup and dispose
   */
  public async dispose(): Promise<void> {
    await this.stop();
    this.instruments.clear();
    this.removeAllListeners();
  }
}
