/**
 * Laboratory - Testing Environment
 *
 * The Laboratory provides a controlled environment for testing components.
 * It orchestrates experiments, manages test subjects, validates hypotheses,
 * and generates comprehensive lab reports.
 */

import { EventEmitter } from 'events';
import type { Stage } from '../core/Stage';
import type { Experiment, ExperimentResult } from './Experiment';
import type { LabReport } from './LabReport';

/**
 * Laboratory configuration
 */
export interface LaboratoryConfig {
  /**
   * Laboratory name
   */
  name?: string;

  /**
   * Associated stage for rendering
   */
  stage?: Stage;

  /**
   * Enable parallel experiment execution
   */
  parallel?: boolean;

  /**
   * Maximum parallel experiments
   */
  maxParallel?: number;

  /**
   * Default timeout for experiments (ms)
   */
  timeout?: number;

  /**
   * Enable detailed logging
   */
  verbose?: boolean;

  /**
   * Auto-cleanup after experiments
   */
  autoCleanup?: boolean;
}

/**
 * Laboratory state
 */
export type LaboratoryState = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

/**
 * Laboratory statistics
 */
export interface LaboratoryStats {
  /**
   * Total experiments
   */
  totalExperiments: number;

  /**
   * Passed experiments
   */
  passed: number;

  /**
   * Failed experiments
   */
  failed: number;

  /**
   * Skipped experiments
   */
  skipped: number;

  /**
   * Total duration (ms)
   */
  duration: number;

  /**
   * Success rate (0-1)
   */
  successRate: number;
}

/**
 * Laboratory - Testing orchestrator
 */
export class Laboratory extends EventEmitter {
  private name: string;
  private stage: Stage | null = null;
  private experiments: Map<string, Experiment> = new Map();
  private results: Map<string, ExperimentResult> = new Map();
  private state: LaboratoryState = 'idle';
  private parallel: boolean = false;
  private maxParallel: number = 5;
  private timeout: number = 5000;
  private verbose: boolean = false;
  private autoCleanup: boolean = true;
  private startTime: number = 0;
  private endTime: number = 0;
  private runningExperiments: Set<string> = new Set();

  constructor(config: LaboratoryConfig = {}) {
    super();

    this.name = config.name ?? 'Laboratory';

    if (config.stage !== undefined) {
      this.stage = config.stage;
    }

    if (config.parallel !== undefined) {
      this.parallel = config.parallel;
    }

    if (config.maxParallel !== undefined) {
      this.maxParallel = config.maxParallel;
    }

    if (config.timeout !== undefined) {
      this.timeout = config.timeout;
    }

    if (config.verbose !== undefined) {
      this.verbose = config.verbose;
    }

    if (config.autoCleanup !== undefined) {
      this.autoCleanup = config.autoCleanup;
    }
  }

  /**
   * Get laboratory name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get laboratory state
   */
  public getState(): LaboratoryState {
    return this.state;
  }

  /**
   * Set associated stage
   */
  public setStage(stage: Stage): void {
    this.stage = stage;
  }

  /**
   * Get associated stage
   */
  public getStage(): Stage | null {
    return this.stage;
  }

  /**
   * Register an experiment
   */
  public registerExperiment(experiment: Experiment): void {
    const id = experiment.getId();

    if (this.experiments.has(id)) {
      throw new Error(`Experiment already registered: ${id}`);
    }

    this.experiments.set(id, experiment);
    this.emit('experiment:registered', { id, name: experiment.getName() });

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(`[Laboratory] Registered experiment: ${experiment.getName()}`);
    }
  }

  /**
   * Unregister an experiment
   */
  public unregisterExperiment(experimentId: string): void {
    if (!this.experiments.has(experimentId)) {
      return;
    }

    this.experiments.delete(experimentId);
    this.results.delete(experimentId);
    this.emit('experiment:unregistered', { id: experimentId });

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(`[Laboratory] Unregistered experiment: ${experimentId}`);
    }
  }

  /**
   * Get an experiment
   */
  public getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  public getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Run all experiments
   */
  public async runAll(): Promise<LabReport> {
    if (this.state === 'running') {
      throw new Error('Laboratory is already running');
    }

    this.state = 'running';
    this.startTime = Date.now();
    this.results.clear();
    this.emit('started');

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(`[Laboratory] Starting ${this.experiments.size} experiments...`);
    }

    try {
      if (this.parallel) {
        await this.runParallel();
      } else {
        await this.runSequential();
      }

      this.endTime = Date.now();
      this.state = 'completed';
      this.emit('completed');

      const report = this.generateReport();

      if (this.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[Laboratory] Completed in ${report.duration}ms`);
        // eslint-disable-next-line no-console
        console.log(
          `[Laboratory] Results: ${report.stats.passed}/${report.stats.totalExperiments} passed`,
        );
      }

      if (this.autoCleanup) {
        await this.cleanup();
      }

      return report;
    } catch (error) {
      this.state = 'failed';
      this.emit('failed', { error });

      if (this.verbose) {
        console.error('[Laboratory] Failed:', error);
      }

      throw error;
    }
  }

  /**
   * Run a specific experiment
   */
  public async runExperiment(experimentId: string): Promise<ExperimentResult> {
    const experiment = this.experiments.get(experimentId);

    if (experiment === undefined) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(`[Laboratory] Running experiment: ${experiment.getName()}`);
    }

    this.runningExperiments.add(experimentId);
    this.emit('experiment:started', { id: experimentId, name: experiment.getName() });

    try {
      const result = await this.executeExperiment(experiment);
      this.results.set(experimentId, result);
      this.runningExperiments.delete(experimentId);

      this.emit('experiment:completed', { id: experimentId, result });

      if (this.verbose) {
        const status = result.success ? 'PASS' : 'FAIL';
        // eslint-disable-next-line no-console
        console.log(`[Laboratory] ${status}: ${experiment.getName()} (${result.duration}ms)`);
      }

      return result;
    } catch (error) {
      this.runningExperiments.delete(experimentId);

      const failedResult: ExperimentResult = {
        experimentId,
        experimentName: experiment.getName(),
        success: false,
        timestamp: new Date(),
        duration: 0,
        hypotheses: [],
        error: error instanceof Error ? error : new Error(String(error)),
      };

      this.results.set(experimentId, failedResult);
      this.emit('experiment:failed', { id: experimentId, error });

      if (this.verbose) {
        console.error(`[Laboratory] FAIL: ${experiment.getName()}`, error);
      }

      return failedResult;
    }
  }

  /**
   * Execute an experiment
   */
  private async executeExperiment(experiment: Experiment): Promise<ExperimentResult> {
    const startTime = Date.now();

    // Set stage if available
    if (this.stage !== null) {
      experiment.setStage(this.stage);
    }

    // Run experiment with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Experiment timeout: ${experiment.getName()}`));
      }, this.timeout);
    });

    const experimentPromise = experiment.run();

    const result = await Promise.race([experimentPromise, timeoutPromise]);

    const duration = Date.now() - startTime;

    return {
      ...result,
      duration,
    };
  }

  /**
   * Run experiments sequentially
   */
  private async runSequential(): Promise<void> {
    for (const experiment of this.experiments.values()) {
      await this.runExperiment(experiment.getId());
    }
  }

  /**
   * Run experiments in parallel
   */
  private async runParallel(): Promise<void> {
    const experimentIds = Array.from(this.experiments.keys());
    const batches: string[][] = [];

    // Create batches
    for (let i = 0; i < experimentIds.length; i += this.maxParallel) {
      batches.push(experimentIds.slice(i, i + this.maxParallel));
    }

    // Run batches
    for (const batch of batches) {
      await Promise.all(batch.map((id) => this.runExperiment(id)));
    }
  }

  /**
   * Pause laboratory
   */
  public pause(): void {
    if (this.state !== 'running') {
      throw new Error('Laboratory is not running');
    }

    this.state = 'paused';
    this.emit('paused');

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log('[Laboratory] Paused');
    }
  }

  /**
   * Resume laboratory
   */
  public resume(): void {
    if (this.state !== 'paused') {
      throw new Error('Laboratory is not paused');
    }

    this.state = 'running';
    this.emit('resumed');

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log('[Laboratory] Resumed');
    }
  }

  /**
   * Stop laboratory
   */
  public stop(): void {
    this.state = 'idle';
    this.runningExperiments.clear();
    this.emit('stopped');

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log('[Laboratory] Stopped');
    }
  }

  /**
   * Get experiment result
   */
  public getResult(experimentId: string): ExperimentResult | undefined {
    return this.results.get(experimentId);
  }

  /**
   * Get all results
   */
  public getAllResults(): ExperimentResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get statistics
   */
  public getStats(): LaboratoryStats {
    const results = Array.from(this.results.values());
    const totalExperiments = results.length;
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const skipped = this.experiments.size - results.length;
    const duration = this.endTime - this.startTime;
    const successRate = totalExperiments > 0 ? passed / totalExperiments : 0;

    return {
      totalExperiments,
      passed,
      failed,
      skipped,
      duration,
      successRate,
    };
  }

  /**
   * Generate lab report
   */
  public generateReport(): LabReport {
    const stats = this.getStats();
    const results = Array.from(this.results.values());

    return {
      laboratoryName: this.name,
      timestamp: new Date(),
      stats,
      results,
      duration: stats.duration,
      success: stats.failed === 0 && stats.skipped === 0,
    };
  }

  /**
   * Clear all experiments and results
   */
  public clear(): void {
    this.experiments.clear();
    this.results.clear();
    this.runningExperiments.clear();
    this.emit('cleared');

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log('[Laboratory] Cleared');
    }
  }

  /**
   * Cleanup laboratory
   */
  public async cleanup(): Promise<void> {
    // Cleanup all experiments
    for (const experiment of this.experiments.values()) {
      await experiment.cleanup();
    }

    this.emit('cleaned-up');

    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log('[Laboratory] Cleaned up');
    }
  }

  /**
   * Check if laboratory is running
   */
  public isRunning(): boolean {
    return this.state === 'running';
  }

  /**
   * Check if laboratory is paused
   */
  public isPaused(): boolean {
    return this.state === 'paused';
  }

  /**
   * Export laboratory data
   */
  public export(): {
    name: string;
    state: LaboratoryState;
    experiments: number;
    results: number;
    stats: LaboratoryStats;
  } {
    return {
      name: this.name,
      state: this.state,
      experiments: this.experiments.size,
      results: this.results.size,
      stats: this.getStats(),
    };
  }
}
