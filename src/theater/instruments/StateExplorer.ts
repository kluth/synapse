/**
 * StateExplorer - Time-travel debugging tool
 *
 * StateExplorer is a Microscope lens that provides time-travel debugging
 * capabilities. It records state changes, allows state inspection, and
 * enables rewinding/replaying component state.
 */

import type { MicroscopeLens, InspectionResult, InspectionIssue } from './Microscope';
import type { VisualNeuron } from '../../ui/VisualNeuron';

/**
 * State snapshot
 */
export interface StateSnapshot {
  /**
   * Snapshot ID
   */
  id: string;

  /**
   * Component ID
   */
  componentId: string;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * State data
   */
  state: Record<string, unknown>;

  /**
   * Props data
   */
  props: Record<string, unknown>;

  /**
   * Diff from previous snapshot
   */
  diff?: StateDiff;

  /**
   * Stack trace of state change
   */
  stackTrace?: string;
}

/**
 * State diff
 */
export interface StateDiff {
  /**
   * Added keys
   */
  added: string[];

  /**
   * Removed keys
   */
  removed: string[];

  /**
   * Modified keys
   */
  modified: Array<{
    key: string;
    oldValue: unknown;
    newValue: unknown;
  }>;

  /**
   * Unchanged keys
   */
  unchanged: string[];
}

/**
 * Time travel action
 */
export type TimeTravelAction = 'pause' | 'resume' | 'step-forward' | 'step-backward' | 'jump';

/**
 * StateExplorer configuration
 */
export interface StateExplorerConfig {
  /**
   * Max snapshots to keep
   */
  maxSnapshots?: number;

  /**
   * Record stack traces
   */
  recordStackTraces?: boolean;

  /**
   * Auto-pause on errors
   */
  autoPauseOnError?: boolean;

  /**
   * Diff threshold (ignore changes below this)
   */
  diffThreshold?: number;

  /**
   * Enable state validation
   */
  validateState?: boolean;
}

/**
 * StateExplorer - Time-travel debugging
 */
export class StateExplorer implements MicroscopeLens {
  public readonly id = 'state-explorer';
  public readonly name = 'State Explorer';
  public readonly mode = 'state' as const;

  private snapshots: StateSnapshot[] = [];
  private currentIndex: number = -1;
  private isPaused: boolean = false;
  private maxSnapshots: number = 500;
  private recordStackTraces: boolean = false;
  private validateState: boolean = true;

  constructor(config: StateExplorerConfig = {}) {
    if (config.maxSnapshots !== undefined) {
      this.maxSnapshots = config.maxSnapshots;
    }
    if (config.recordStackTraces !== undefined) {
      this.recordStackTraces = config.recordStackTraces;
    }
    // autoPauseOnError and diffThreshold are reserved for future use
    if (config.autoPauseOnError !== undefined) {
      // Future: this.autoPauseOnError = config.autoPauseOnError;
    }
    if (config.diffThreshold !== undefined) {
      // Future: this.diffThreshold = config.diffThreshold;
    }
    if (config.validateState !== undefined) {
      this.validateState = config.validateState;
    }
  }

  /**
   * Initialize explorer
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async initialize(): Promise<void> {
    this.snapshots = [];
    this.currentIndex = -1;
    this.isPaused = false;
  }

  /**
   * Cleanup explorer
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async cleanup(): Promise<void> {
    this.snapshots = [];
    this.currentIndex = -1;
    this.isPaused = false;
  }

  /**
   * Inspect component state
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async inspect(component: VisualNeuron): Promise<InspectionResult> {
    const componentId = this.getComponentId(component);
    const state = this.extractState(component);
    const props = this.extractProps(component);
    const issues: InspectionIssue[] = [];

    // Create snapshot if not paused
    if (!this.isPaused) {
      const snapshot = this.createSnapshot(componentId, state, props);
      this.addSnapshot(snapshot);
    }

    // Validate state
    if (this.validateState) {
      const validationIssues = this.validateComponentState(state);
      issues.push(...validationIssues);
    }

    // Analyze state changes
    const changeAnalysis = this.analyzeStateChanges();
    if (changeAnalysis.frequentChanges.length > 0) {
      issues.push({
        severity: 'info',
        message: `High-frequency state changes detected in: ${changeAnalysis.frequentChanges.join(', ')}`,
        suggestion: 'Consider batching updates or using derived state',
      });
    }

    return {
      mode: 'state',
      timestamp: new Date(),
      componentId,
      data: {
        currentSnapshot: this.getCurrentSnapshot(),
        snapshots: this.snapshots,
        currentIndex: this.currentIndex,
        isPaused: this.isPaused,
        stats: {
          totalSnapshots: this.snapshots.length,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          stateKeys: state !== null && state !== undefined ? Object.keys(state).length : 0,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          propsKeys: props !== null && props !== undefined ? Object.keys(props).length : 0,
        },
        analysis: changeAnalysis,
      },
      issues,
      metadata: {
        recordStackTraces: this.recordStackTraces,
        validateState: this.validateState,
      },
    };
  }

  /**
   * Render explorer UI
   */
  public render(): string {
    const current = this.getCurrentSnapshot();

    return `
      <div class="state-explorer">
        <div class="explorer-controls">
          <button class="time-travel-btn" data-action="step-backward" ${this.currentIndex <= 0 ? 'disabled' : ''}>
            ⏮️ Previous
          </button>
          <button class="time-travel-btn" data-action="${this.isPaused ? 'resume' : 'pause'}">
            ${this.isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button class="time-travel-btn" data-action="step-forward" ${this.currentIndex >= this.snapshots.length - 1 ? 'disabled' : ''}>
            ⏭️ Next
          </button>
          <span class="snapshot-counter">${this.currentIndex + 1} / ${this.snapshots.length}</span>
        </div>
        <div class="state-timeline">
          ${this.renderTimeline()}
        </div>
        <div class="state-viewer">
          ${current !== undefined ? this.renderSnapshot(current) : '<p>No snapshot available</p>'}
        </div>
      </div>
    `;
  }

  /**
   * Create a state snapshot
   */
  private createSnapshot(
    componentId: string,
    state: Record<string, unknown>,
    props: Record<string, unknown>,
  ): StateSnapshot {
    const id = `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const previous = this.getCurrentSnapshot();

    const snapshot: StateSnapshot = {
      id,
      componentId,
      timestamp: new Date(),
      state: { ...state },
      props: { ...props },
    };

    // Calculate diff
    if (previous !== undefined) {
      snapshot.diff = this.calculateDiff(previous.state, state);
    }

    // Record stack trace
    if (this.recordStackTraces) {
      const stackTrace = new Error().stack;
      if (stackTrace !== undefined) {
        snapshot.stackTrace = stackTrace;
      }
    }

    return snapshot;
  }

  /**
   * Add snapshot to history
   */
  private addSnapshot(snapshot: StateSnapshot): void {
    // Remove any snapshots after current index (for time travel)
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
    }

    this.snapshots.push(snapshot);
    this.currentIndex = this.snapshots.length - 1;

    // Trim if exceeded max
    if (this.snapshots.length > this.maxSnapshots) {
      const trimCount = this.snapshots.length - this.maxSnapshots;
      this.snapshots = this.snapshots.slice(trimCount);
      this.currentIndex -= trimCount;
    }
  }

  /**
   * Calculate state diff
   */
  private calculateDiff(
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>,
  ): StateDiff {
    const oldKeys = new Set(Object.keys(oldState));
    const newKeys = new Set(Object.keys(newState));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: StateDiff['modified'] = [];
    const unchanged: string[] = [];

    // Find added keys
    for (const key of newKeys) {
      if (!oldKeys.has(key)) {
        added.push(key);
      }
    }

    // Find removed keys
    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        removed.push(key);
      }
    }

    // Find modified/unchanged keys
    for (const key of newKeys) {
      if (oldKeys.has(key)) {
        if (oldState[key] !== newState[key]) {
          modified.push({
            key,
            oldValue: oldState[key],
            newValue: newState[key],
          });
        } else {
          unchanged.push(key);
        }
      }
    }

    return { added, removed, modified, unchanged };
  }

  /**
   * Extract state from component
   */
  private extractState(_component: VisualNeuron): Record<string, unknown> {
    // Simplified extraction - in reality would use component introspection
    return {};
  }

  /**
   * Extract props from component
   */
  private extractProps(_component: VisualNeuron): Record<string, unknown> {
    // Simplified extraction - in reality would use component introspection
    // VisualNeuron stores props in protected receptiveField
    // In a real implementation, this would have proper accessor methods
    return {};
  }

  /**
   * Get component ID
   */
  private getComponentId(_component: VisualNeuron): string {
    return 'component';
  }

  /**
   * Validate component state
   */
  private validateComponentState(state: Record<string, unknown>): InspectionIssue[] {
    const issues: InspectionIssue[] = [];

    // Check for undefined values
    for (const [key, value] of Object.entries(state)) {
      if (value === undefined) {
        issues.push({
          severity: 'warning',
          message: `State key "${key}" has undefined value`,
          suggestion: 'Consider using null or removing the key',
        });
      }
    }

    return issues;
  }

  /**
   * Analyze state changes
   */
  private analyzeStateChanges(): {
    frequentChanges: string[];
    recentChanges: Array<{ key: string; count: number }>;
  } {
    const changeCounts = new Map<string, number>();

    // Count changes per key
    for (const snapshot of this.snapshots) {
      if (snapshot.diff !== undefined) {
        for (const { key } of snapshot.diff.modified) {
          changeCounts.set(key, (changeCounts.get(key) ?? 0) + 1);
        }
      }
    }

    // Find frequently changing keys (>10 changes)
    const frequentChanges: string[] = [];
    for (const [key, count] of changeCounts) {
      if (count > 10) {
        frequentChanges.push(key);
      }
    }

    const recentChanges = Array.from(changeCounts.entries()).map(([key, count]) => ({
      key,
      count,
    }));

    return { frequentChanges, recentChanges };
  }

  /**
   * Time travel
   */
  public timeTravel(action: TimeTravelAction, target?: number): void {
    switch (action) {
      case 'pause':
        this.isPaused = true;
        break;

      case 'resume':
        this.isPaused = false;
        break;

      case 'step-backward':
        if (this.currentIndex > 0) {
          this.currentIndex--;
        }
        break;

      case 'step-forward':
        if (this.currentIndex < this.snapshots.length - 1) {
          this.currentIndex++;
        }
        break;

      case 'jump':
        if (target !== undefined && target >= 0 && target < this.snapshots.length) {
          this.currentIndex = target;
        }
        break;
    }
  }

  /**
   * Get current snapshot
   */
  public getCurrentSnapshot(): StateSnapshot | undefined {
    return this.snapshots[this.currentIndex];
  }

  /**
   * Get all snapshots
   */
  public getAllSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get snapshot by ID
   */
  public getSnapshot(id: string): StateSnapshot | undefined {
    return this.snapshots.find((s) => s.id === id);
  }

  /**
   * Clear snapshots
   */
  public clearSnapshots(): void {
    this.snapshots = [];
    this.currentIndex = -1;
  }

  /**
   * Render timeline
   */
  private renderTimeline(): string {
    return this.snapshots
      .map(
        (snapshot, index) => `
        <div class="timeline-point ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
          <span>${snapshot.timestamp.toLocaleTimeString()}</span>
        </div>
      `,
      )
      .join('');
  }

  /**
   * Render snapshot
   */
  private renderSnapshot(snapshot: StateSnapshot): string {
    return `
      <div class="snapshot-details">
        <h3>Snapshot ${snapshot.id}</h3>
        <p>Timestamp: ${snapshot.timestamp.toISOString()}</p>
        <div class="snapshot-state">
          <h4>State</h4>
          <pre>${JSON.stringify(snapshot.state, null, 2)}</pre>
        </div>
        <div class="snapshot-props">
          <h4>Props</h4>
          <pre>${JSON.stringify(snapshot.props, null, 2)}</pre>
        </div>
        ${snapshot.diff !== undefined ? this.renderDiff(snapshot.diff) : ''}
      </div>
    `;
  }

  /**
   * Render diff
   */
  private renderDiff(diff: StateDiff): string {
    return `
      <div class="snapshot-diff">
        <h4>Changes</h4>
        ${diff.added.length > 0 ? `<p>Added: ${diff.added.join(', ')}</p>` : ''}
        ${diff.removed.length > 0 ? `<p>Removed: ${diff.removed.join(', ')}</p>` : ''}
        ${diff.modified.length > 0 ? `<p>Modified: ${diff.modified.map((m) => m.key).join(', ')}</p>` : ''}
      </div>
    `;
  }
}
