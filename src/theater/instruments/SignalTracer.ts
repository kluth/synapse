/**
 * SignalTracer - Neural signal visualization tool
 *
 * SignalTracer is a Microscope lens that visualizes signal flow through
 * the nervous system. It tracks signal propagation, transformations,
 * and inter-component communication.
 */

import type { MicroscopeLens, InspectionResult, InspectionIssue } from './Microscope';
import type { VisualNeuron } from '../../ui/VisualNeuron';

/**
 * Signal type placeholder
 * In a real implementation, this would integrate with the nervous system
 */
export interface Signal<T = unknown> {
  value: T;
}

/**
 * Signal trace entry
 */
export interface SignalTrace {
  /**
   * Signal ID
   */
  signalId: string;

  /**
   * Signal name
   */
  name: string;

  /**
   * Current value
   */
  value: unknown;

  /**
   * Previous value
   */
  previousValue: unknown;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Source component
   */
  source?: string;

  /**
   * Target components
   */
  targets: string[];

  /**
   * Propagation path
   */
  path: string[];

  /**
   * Update count
   */
  updateCount: number;
}

/**
 * Signal flow graph
 */
export interface SignalFlowGraph {
  /**
   * Nodes (components)
   */
  nodes: Array<{
    id: string;
    label: string;
    type: 'source' | 'target' | 'intermediate';
  }>;

  /**
   * Edges (signal connections)
   */
  edges: Array<{
    from: string;
    to: string;
    signal: string;
    weight: number;
  }>;
}

/**
 * SignalTracer configuration
 */
export interface SignalTracerConfig {
  /**
   * Max traces to keep
   */
  maxTraces?: number;

  /**
   * Track signal history
   */
  trackHistory?: boolean;

  /**
   * Detect circular dependencies
   */
  detectCircular?: boolean;

  /**
   * Highlight slow signals (ms threshold)
   */
  slowSignalThreshold?: number;
}

/**
 * SignalTracer - Neural signal visualization
 */
export class SignalTracer implements MicroscopeLens {
  public readonly id = 'signal-tracer';
  public readonly name = 'Signal Tracer';
  public readonly mode = 'signals' as const;

  private traces: Map<string, SignalTrace> = new Map();
  private signalHistory: Array<{ signalId: string; value: unknown; timestamp: Date }> = [];
  private maxTraces: number = 1000;
  private trackHistory: boolean = true;
  private detectCircular: boolean = true;
  private slowSignalThreshold: number = 100;

  constructor(config: SignalTracerConfig = {}) {
    if (config.maxTraces !== undefined) {
      this.maxTraces = config.maxTraces;
    }
    if (config.trackHistory !== undefined) {
      this.trackHistory = config.trackHistory;
    }
    if (config.detectCircular !== undefined) {
      this.detectCircular = config.detectCircular;
    }
    if (config.slowSignalThreshold !== undefined) {
      this.slowSignalThreshold = config.slowSignalThreshold;
    }
  }

  /**
   * Initialize tracer
   */

  public async initialize(): Promise<void> {
    this.traces.clear();
    this.signalHistory = [];
  }

  /**
   * Cleanup tracer
   */

  public async cleanup(): Promise<void> {
    this.traces.clear();
    this.signalHistory = [];
  }

  /**
   * Inspect component signals
   */

  public async inspect(component: VisualNeuron): Promise<InspectionResult> {
    const startTime = Date.now();
    const signals = this.extractSignals(component);
    const issues: InspectionIssue[] = [];

    // Track each signal
    for (const signal of signals) {
      this.traceSignal(signal, component);
    }

    // Detect issues
    if (this.detectCircular) {
      const circularIssues = this.detectCircularDependencies();
      issues.push(...circularIssues);
    }

    const slowSignals = this.detectSlowSignals();
    issues.push(...slowSignals);

    const flowGraph = this.buildFlowGraph();

    const inspectionTime = Date.now() - startTime;

    return {
      mode: 'signals',
      timestamp: new Date(),
      componentId: this.getComponentId(component),
      data: {
        signals: Array.from(this.traces.values()),
        flowGraph,
        stats: {
          totalSignals: signals.length,
          activeSignals: this.traces.size,
          historySize: this.signalHistory.length,
          inspectionTime,
        },
      },
      issues,
      metadata: {
        trackHistory: this.trackHistory,
        detectCircular: this.detectCircular,
      },
    };
  }

  /**
   * Render tracer UI
   */
  public render(): string {
    return `
      <div class="signal-tracer">
        <div class="tracer-stats">
          <span>Active Signals: ${this.traces.size}</span>
          <span>History: ${this.signalHistory.length}</span>
        </div>
        <div class="signal-list">
          ${Array.from(this.traces.values())
            .map(
              (trace) => `
            <div class="signal-item">
              <strong>${trace.name}</strong>
              <span>Updates: ${trace.updateCount}</span>
              <span>Targets: ${trace.targets.length}</span>
            </div>
          `,
            )
            .join('')}
        </div>
        <div class="signal-graph">
          <canvas id="signal-flow-graph"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Extract signals from component
   */
  private extractSignals(component: VisualNeuron): Signal<unknown>[] {
    const signals: Signal<unknown>[] = [];

    // Access component's internal signals through state
    // This is a simplified extraction - in reality would use component introspection
    const componentData = component as unknown as { signals?: Map<string, Signal<unknown>> };

    if (componentData.signals !== undefined) {
      for (const signal of componentData.signals.values()) {
        signals.push(signal);
      }
    }

    return signals;
  }

  /**
   * Trace a signal
   */
  private traceSignal(signal: Signal<unknown>, component: VisualNeuron): void {
    const signalId = this.getSignalId(signal);
    const existingTrace = this.traces.get(signalId);

    const trace: SignalTrace = {
      signalId,
      name: this.getSignalName(signal),

      value: signal.value,
      previousValue: existingTrace?.value,
      timestamp: new Date(),
      source: this.getComponentId(component),
      targets: this.getSignalTargets(signal),
      path: this.buildSignalPath(signal),
      updateCount: (existingTrace?.updateCount ?? 0) + 1,
    };

    this.traces.set(signalId, trace);

    // Add to history
    if (this.trackHistory) {
      this.signalHistory.push({
        signalId,

        value: signal.value,
        timestamp: new Date(),
      });

      // Trim history if needed
      if (this.signalHistory.length > this.maxTraces) {
        this.signalHistory = this.signalHistory.slice(-this.maxTraces);
      }
    }
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(): InspectionIssue[] {
    const issues: InspectionIssue[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (signalId: string, path: string[]): boolean => {
      if (!visited.has(signalId)) {
        visited.add(signalId);
        recursionStack.add(signalId);

        const trace = this.traces.get(signalId);
        if (trace !== undefined) {
          for (const target of trace.targets) {
            if (!visited.has(target) && detectCycle(target, [...path, target])) {
              return true;
            } else if (recursionStack.has(target)) {
              issues.push({
                severity: 'warning',
                message: `Circular signal dependency detected: ${[...path, target].join(' → ')}`,
                source: signalId,
                suggestion: 'Review signal flow to break circular dependencies',
              });
              return true;
            }
          }
        }
      }

      recursionStack.delete(signalId);
      return false;
    };

    for (const signalId of this.traces.keys()) {
      detectCycle(signalId, [signalId]);
    }

    return issues;
  }

  /**
   * Detect slow signals
   */
  private detectSlowSignals(): InspectionIssue[] {
    const issues: InspectionIssue[] = [];

    // Group signals by update frequency
    const now = Date.now();
    for (const trace of this.traces.values()) {
      const timeSinceUpdate = now - trace.timestamp.getTime();

      if (timeSinceUpdate > this.slowSignalThreshold && trace.updateCount > 0) {
        issues.push({
          severity: 'info',
          message: `Signal "${trace.name}" hasn't updated in ${timeSinceUpdate}ms`,
          source: trace.signalId,
          suggestion: 'Check if signal is still needed or if updates are being blocked',
        });
      }
    }

    return issues;
  }

  /**
   * Build signal flow graph
   */
  private buildFlowGraph(): SignalFlowGraph {
    const nodes = new Map<
      string,
      { id: string; label: string; type: 'source' | 'target' | 'intermediate' }
    >();
    const edges: SignalFlowGraph['edges'] = [];

    for (const trace of this.traces.values()) {
      // Add source node
      if (trace.source !== undefined && !nodes.has(trace.source)) {
        nodes.set(trace.source, {
          id: trace.source,
          label: trace.source,
          type: 'source',
        });
      }

      // Add target nodes and edges
      for (const target of trace.targets) {
        if (!nodes.has(target)) {
          nodes.set(target, {
            id: target,
            label: target,
            type: 'target',
          });
        }

        if (trace.source !== undefined) {
          edges.push({
            from: trace.source,
            to: target,
            signal: trace.name,
            weight: trace.updateCount,
          });
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  /**
   * Get signal ID
   */
  private getSignalId(_signal: Signal<unknown>): string {
    // In a real implementation, signals would have IDs
    return `signal-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get signal name
   */
  private getSignalName(signal: Signal<unknown>): string {
    // In a real implementation, signals would have names

    return `Signal<${typeof signal.value}>`;
  }

  /**
   * Get component ID
   */
  private getComponentId(_component: VisualNeuron): string {
    // In a real implementation, components would have IDs
    return 'component';
  }

  /**
   * Get signal targets
   */
  private getSignalTargets(_signal: Signal<unknown>): string[] {
    // In a real implementation, would track signal subscribers
    return [];
  }

  /**
   * Build signal propagation path
   */
  private buildSignalPath(_signal: Signal<unknown>): string[] {
    // In a real implementation, would track signal propagation
    return [];
  }

  /**
   * Get trace by signal ID
   */
  public getTrace(signalId: string): SignalTrace | undefined {
    return this.traces.get(signalId);
  }

  /**
   * Get all traces
   */
  public getAllTraces(): SignalTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get signal history
   */
  public getHistory(
    signalId?: string,
  ): Array<{ signalId: string; value: unknown; timestamp: Date }> {
    if (signalId !== undefined) {
      return this.signalHistory.filter((entry) => entry.signalId === signalId);
    }
    return [...this.signalHistory];
  }

  /**
   * Clear traces
   */
  public clearTraces(): void {
    this.traces.clear();
    this.signalHistory = [];
  }
}
