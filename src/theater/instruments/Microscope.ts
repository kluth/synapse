/**
 * Microscope - Central debugging and inspection hub
 *
 * The Microscope is the primary instrument for deep component inspection.
 * It coordinates specialized tools (SignalTracer, StateExplorer, etc.)
 * and provides a unified interface for debugging.
 */

import { Instrument, type InstrumentConfig } from '../core/Instrument';
import type { SkinCell } from '../../ui/SkinCell';

/**
 * Inspection mode
 */
export type InspectionMode = 'signals' | 'state' | 'performance' | 'health' | 'structure';

/**
 * Microscope lens (specialized inspection tool)
 */
export interface MicroscopeLens {
  /**
   * Lens identifier
   */
  id: string;

  /**
   * Lens name
   */
  name: string;

  /**
   * Associated inspection mode
   */
  mode: InspectionMode;

  /**
   * Initialize the lens
   */
  initialize: () => Promise<void>;

  /**
   * Cleanup the lens
   */
  cleanup: () => Promise<void>;

  /**
   * Inspect a component
   */
  inspect: (component: SkinCell<any, any>) => Promise<InspectionResult>;

  /**
   * Render lens UI
   */
  render: () => string;
}

/**
 * Inspection result
 */
export interface InspectionResult {
  /**
   * Inspection mode
   */
  mode: InspectionMode;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Component ID
   */
  componentId?: string;

  /**
   * Inspection data
   */
  data: unknown;

  /**
   * Issues found
   */
  issues?: InspectionIssue[];

  /**
   * Metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Inspection issue
 */
export interface InspectionIssue {
  /**
   * Severity level
   */
  severity: 'error' | 'warning' | 'info';

  /**
   * Issue message
   */
  message: string;

  /**
   * Source location
   */
  source?: string;

  /**
   * Suggested fix
   */
  suggestion?: string;
}

/**
 * Microscope configuration
 */
export interface MicroscopeConfig {
  /**
   * Unique instrument ID
   */
  id?: string;

  /**
   * Display name
   */
  name?: string;

  /**
   * Icon (emoji or SVG)
   */
  icon?: string;

  /**
   * Default position
   */
  defaultPosition?: InstrumentConfig['defaultPosition'];

  /**
   * Default state
   */
  defaultState?: InstrumentConfig['defaultState'];

  /**
   * Keyboard shortcut
   */
  shortcut?: string;

  /**
   * Instrument priority (for ordering)
   */
  priority?: number;

  /**
   * Default inspection mode
   */
  defaultMode?: InspectionMode;

  /**
   * Auto-inspect on component mount
   */
  autoInspect?: boolean;

  /**
   * Record inspection history
   */
  recordHistory?: boolean;

  /**
   * Max history entries
   */
  maxHistorySize?: number;

  /**
   * Enable real-time updates
   */
  realTimeUpdates?: boolean;
}

/**
 * Microscope - Central debugging hub
 */
export class Microscope extends Instrument {
  private currentMode: InspectionMode = 'signals';
  private lenses: Map<InspectionMode, MicroscopeLens> = new Map();
  private inspectionHistory: InspectionResult[] = [];
  private currentComponent: SkinCell<any, any> | null = null;
  private autoInspect: boolean = false;
  private recordHistory: boolean = true;
  private maxHistorySize: number = 100;
  private realTimeUpdates: boolean = true;
  private realTimeInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: MicroscopeConfig = {}) {
    // Build InstrumentConfig with only defined optional properties
    const instrumentConfig: InstrumentConfig = {
      id: config.id ?? 'microscope',
      name: config.name ?? 'Microscope',
    };

    if (config.icon !== undefined) {
      instrumentConfig.icon = config.icon;
    } else {
      instrumentConfig.icon = '🔬';
    }

    if (config.defaultPosition !== undefined) {
      instrumentConfig.defaultPosition = config.defaultPosition;
    } else {
      instrumentConfig.defaultPosition = 'right';
    }

    if (config.defaultState !== undefined) {
      instrumentConfig.defaultState = config.defaultState;
    }

    if (config.shortcut !== undefined) {
      instrumentConfig.shortcut = config.shortcut;
    }

    if (config.priority !== undefined) {
      instrumentConfig.priority = config.priority;
    }

    super(instrumentConfig);

    if (config.defaultMode !== undefined) {
      this.currentMode = config.defaultMode;
    }
    if (config.autoInspect !== undefined) {
      this.autoInspect = config.autoInspect;
    }
    if (config.recordHistory !== undefined) {
      this.recordHistory = config.recordHistory;
    }
    if (config.maxHistorySize !== undefined) {
      this.maxHistorySize = config.maxHistorySize;
    }
    if (config.realTimeUpdates !== undefined) {
      this.realTimeUpdates = config.realTimeUpdates;
    }
  }

  /**
   * Initialize microscope
   */
  public async initialize(): Promise<void> {
    // Initialize all registered lenses
    for (const lens of this.lenses.values()) {
      await lens.initialize();
    }

    this.emit('initialized', { lensCount: this.lenses.size });
  }

  /**
   * Cleanup microscope
   */
  public async cleanup(): Promise<void> {
    // Stop real-time updates
    this.stopRealTimeUpdates();

    // Cleanup all lenses
    for (const lens of this.lenses.values()) {
      await lens.cleanup();
    }

    // Clear history
    this.inspectionHistory = [];
    this.currentComponent = null;

    this.emit('cleaned-up');
  }

  /**
   * Render microscope UI
   */
  public render(): string {
    const activeLens = this.lenses.get(this.currentMode);
    const lensUI = activeLens !== undefined ? activeLens.render() : '<p>No lens selected</p>';

    return `
      <div class="microscope">
        <div class="microscope-header">
          <h2>🔬 Microscope</h2>
          <div class="mode-selector">
            ${Array.from(this.lenses.keys())
              .map(
                (mode) =>
                  `<button class="mode-btn ${mode === this.currentMode ? 'active' : ''}" data-mode="${mode}">
                ${mode}
              </button>`,
              )
              .join('')}
          </div>
        </div>
        <div class="microscope-content">
          ${lensUI}
        </div>
        <div class="microscope-footer">
          <span>History: ${this.inspectionHistory.length} entries</span>
          <button class="clear-history">Clear</button>
        </div>
      </div>
    `;
  }

  /**
   * Register a lens
   */
  public registerLens(lens: MicroscopeLens): void {
    if (this.lenses.has(lens.mode)) {
      throw new Error(`Lens already registered for mode: ${lens.mode}`);
    }

    this.lenses.set(lens.mode, lens);
    this.emit('lens-registered', { mode: lens.mode, name: lens.name });
  }

  /**
   * Unregister a lens
   */
  public async unregisterLens(mode: InspectionMode): Promise<void> {
    const lens = this.lenses.get(mode);
    if (lens === undefined) {
      return;
    }

    await lens.cleanup();
    this.lenses.delete(mode);
    this.emit('lens-unregistered', { mode });
  }

  /**
   * Get a lens
   */
  public getLens(mode: InspectionMode): MicroscopeLens | undefined {
    return this.lenses.get(mode);
  }

  /**
   * Get all lenses
   */
  public getAllLenses(): Map<InspectionMode, MicroscopeLens> {
    return new Map(this.lenses);
  }

  /**
   * Set inspection mode
   */
  public setMode(mode: InspectionMode): void {
    if (!this.lenses.has(mode)) {
      throw new Error(`No lens registered for mode: ${mode}`);
    }

    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.emit('mode-changed', { previousMode, currentMode: mode });

    // Re-inspect current component if auto-inspect is enabled
    if (this.autoInspect && this.currentComponent !== null) {
      void this.inspect(this.currentComponent);
    }
  }

  /**
   * Get current mode
   */
  public getMode(): InspectionMode {
    return this.currentMode;
  }

  /**
   * Inspect a component
   */
  public async inspect(component: SkinCell<any, any>): Promise<InspectionResult> {
    this.currentComponent = component;

    const lens = this.lenses.get(this.currentMode);
    if (lens === undefined) {
      throw new Error(`No lens available for mode: ${this.currentMode}`);
    }

    const result = await lens.inspect(component);

    // Record in history
    if (this.recordHistory) {
      this.addToHistory(result);
    }

    this.emit('inspection-complete', result);

    return result;
  }

  /**
   * Add result to history
   */
  private addToHistory(result: InspectionResult): void {
    this.inspectionHistory.push(result);

    // Trim history if needed
    if (this.inspectionHistory.length > this.maxHistorySize) {
      this.inspectionHistory = this.inspectionHistory.slice(-this.maxHistorySize);
    }

    this.emit('history-updated', { size: this.inspectionHistory.length });
  }

  /**
   * Get inspection history
   */
  public getHistory(): InspectionResult[] {
    return [...this.inspectionHistory];
  }

  /**
   * Get history for specific mode
   */
  public getHistoryForMode(mode: InspectionMode): InspectionResult[] {
    return this.inspectionHistory.filter((result) => result.mode === mode);
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.inspectionHistory = [];
    this.emit('history-cleared');
  }

  /**
   * Get current component
   */
  public getCurrentComponent(): SkinCell<any, any> | null {
    return this.currentComponent;
  }

  /**
   * Start real-time updates
   */
  public startRealTimeUpdates(interval: number = 1000): void {
    if (!this.realTimeUpdates || this.realTimeInterval !== null) {
      return;
    }

    this.realTimeInterval = setInterval(() => {
      if (this.currentComponent !== null) {
        void this.inspect(this.currentComponent);
      }
    }, interval);

    this.emit('real-time-started', { interval });
  }

  /**
   * Stop real-time updates
   */
  public stopRealTimeUpdates(): void {
    if (this.realTimeInterval !== null) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
      this.emit('real-time-stopped');
    }
  }

  /**
   * Check if real-time updates are active
   */
  public isRealTimeActive(): boolean {
    return this.realTimeInterval !== null;
  }

  /**
   * Export microscope data
   */
  public exportData(): {
    currentMode: InspectionMode;
    lenses: string[];
    history: InspectionResult[];
    stats: {
      totalInspections: number;
      issuesFound: number;
      avgInspectionTime: number;
    };
  } {
    const issuesFound = this.inspectionHistory.reduce(
      (count, result) => count + (result.issues?.length ?? 0),
      0,
    );

    return {
      currentMode: this.currentMode,
      lenses: Array.from(this.lenses.keys()),
      history: [...this.inspectionHistory],
      stats: {
        totalInspections: this.inspectionHistory.length,
        issuesFound,
        avgInspectionTime: 0, // TODO: Track inspection times
      },
    };
  }
}
