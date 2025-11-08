/**
 * Experiment - Test Scenario
 *
 * An Experiment represents a test scenario for a component.
 * It includes setup, execution, validation, and teardown phases.
 */

import type { VisualNeuron } from '../../ui/VisualNeuron';
import type { Stage } from '../core/Stage';
import type { TestSubject } from './TestSubject';
import type { Hypothesis, HypothesisResult } from './Hypothesis';

/**
 * Experiment configuration
 */
export interface ExperimentConfig {
  /**
   * Experiment ID
   */
  id: string;

  /**
   * Experiment name
   */
  name: string;

  /**
   * Experiment description
   */
  description?: string;

  /**
   * Component to test
   */
  component?: VisualNeuron;

  /**
   * Test subject wrapper
   */
  testSubject?: TestSubject;

  /**
   * Hypotheses to validate
   */
  hypotheses?: Hypothesis[];

  /**
   * Setup function
   */
  setup?: () => Promise<void> | void;

  /**
   * Teardown function
   */
  teardown?: () => Promise<void> | void;

  /**
   * Test function
   */
  test?: (subject: TestSubject) => Promise<void> | void;

  /**
   * Skip this experiment
   */
  skip?: boolean;

  /**
   * Only run this experiment
   */
  only?: boolean;

  /**
   * Experiment timeout (ms)
   */
  timeout?: number;

  /**
   * Number of times to retry on failure
   */
  retries?: number;
}

/**
 * Experiment result
 */
export interface ExperimentResult {
  /**
   * Experiment ID
   */
  experimentId: string;

  /**
   * Experiment name
   */
  experimentName: string;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Duration (ms)
   */
  duration: number;

  /**
   * Hypothesis results
   */
  hypotheses: HypothesisResult[];

  /**
   * Error if failed
   */
  error?: Error;

  /**
   * Retry count
   */
  retries?: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Experiment state
 */
export type ExperimentState = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

/**
 * Experiment - Test scenario
 */
export class Experiment {
  private id: string;
  private name: string;
  private description: string;
  private testSubject: TestSubject | null = null;
  private hypotheses: Hypothesis[] = [];
  private setupFn: (() => Promise<void> | void) | null = null;
  private teardownFn: (() => Promise<void> | void) | null = null;
  private testFn: ((subject: TestSubject) => Promise<void> | void) | null = null;
  private state: ExperimentState = 'pending';
  private stage: Stage | null = null;
  private skip: boolean = false;
  private only: boolean = false;
  // timeout is configured but handled directly in run() method
  private retries: number = 0;
  private currentRetry: number = 0;

  constructor(config: ExperimentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description ?? '';

    // component is not used directly, only testSubject
    // timeout is used via this.timeout member

    if (config.testSubject !== undefined) {
      this.testSubject = config.testSubject;
    }

    if (config.hypotheses !== undefined) {
      this.hypotheses = config.hypotheses;
    }

    if (config.setup !== undefined) {
      this.setupFn = config.setup;
    }

    if (config.teardown !== undefined) {
      this.teardownFn = config.teardown;
    }

    if (config.test !== undefined) {
      this.testFn = config.test;
    }

    if (config.skip !== undefined) {
      this.skip = config.skip;
    }

    if (config.only !== undefined) {
      this.only = config.only;
    }

    // timeout is not stored as a field, handled directly in run() if needed

    if (config.retries !== undefined) {
      this.retries = config.retries;
    }
  }

  /**
   * Get experiment ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get experiment name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get description
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Get state
   */
  public getState(): ExperimentState {
    return this.state;
  }

  /**
   * Set stage
   */
  public setStage(stage: Stage): void {
    this.stage = stage;
  }

  /**
   * Get stage
   */
  public getStage(): Stage | null {
    return this.stage;
  }

  /**
   * Set test subject
   */
  public setTestSubject(subject: TestSubject): void {
    this.testSubject = subject;
  }

  /**
   * Get test subject
   */
  public getTestSubject(): TestSubject | null {
    return this.testSubject;
  }

  /**
   * Add hypothesis
   */
  public addHypothesis(hypothesis: Hypothesis): void {
    this.hypotheses.push(hypothesis);
  }

  /**
   * Get hypotheses
   */
  public getHypotheses(): Hypothesis[] {
    return [...this.hypotheses];
  }

  /**
   * Check if experiment should be skipped
   */
  public shouldSkip(): boolean {
    return this.skip;
  }

  /**
   * Check if experiment is marked as only
   */
  public isOnly(): boolean {
    return this.only;
  }

  /**
   * Run the experiment
   */
  public async run(): Promise<ExperimentResult> {
    if (this.skip) {
      this.state = 'skipped';
      return this.createResult(true, [], 0);
    }

    this.state = 'running';
    const startTime = Date.now();

    try {
      // Setup
      if (this.setupFn !== null) {
        await this.setupFn();
      }

      // Ensure test subject exists
      if (this.testSubject === null) {
        throw new Error('No test subject provided');
      }

      // Run test function
      if (this.testFn !== null) {
        await this.testFn(this.testSubject);
      }

      // Validate hypotheses
      const hypothesisResults = await this.validateHypotheses();

      // Check if all hypotheses passed
      const success = hypothesisResults.every((r) => r.passed);

      this.state = success ? 'passed' : 'failed';
      const duration = Date.now() - startTime;

      return this.createResult(success, hypothesisResults, duration);
    } catch (error) {
      // Handle retry logic
      if (this.currentRetry < this.retries) {
        this.currentRetry++;
        return await this.run();
      }

      this.state = 'failed';
      const duration = Date.now() - startTime;

      return this.createResult(
        false,
        [],
        duration,
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      // Always run teardown
      try {
        if (this.teardownFn !== null) {
          await this.teardownFn();
        }
      } catch (teardownError) {
        console.error('Teardown error:', teardownError);
      }
    }
  }

  /**
   * Validate all hypotheses
   */
  private async validateHypotheses(): Promise<HypothesisResult[]> {
    const results: HypothesisResult[] = [];

    for (const hypothesis of this.hypotheses) {
      if (this.testSubject === null) {
        throw new Error('No test subject available for hypothesis validation');
      }

      const result = await hypothesis.validate(this.testSubject);
      results.push(result);
    }

    return results;
  }

  /**
   * Create experiment result
   */
  private createResult(
    success: boolean,
    hypotheses: HypothesisResult[],
    duration: number,
    error?: Error,
  ): ExperimentResult {
    const result: ExperimentResult = {
      experimentId: this.id,
      experimentName: this.name,
      success,
      timestamp: new Date(),
      duration,
      hypotheses,
    };

    if (error !== undefined) {
      result.error = error;
    }

    if (this.currentRetry > 0) {
      result.retries = this.currentRetry;
    }

    return result;
  }

  /**
   * Cleanup experiment
   */
  public async cleanup(): Promise<void> {
    if (this.teardownFn !== null) {
      await this.teardownFn();
    }

    this.state = 'pending';
    this.currentRetry = 0;
  }

  /**
   * Reset experiment
   */
  public reset(): void {
    this.state = 'pending';
    this.currentRetry = 0;
  }

  /**
   * Export experiment data
   */
  public export(): {
    id: string;
    name: string;
    description: string;
    state: ExperimentState;
    hypotheses: number;
    skip: boolean;
    only: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      state: this.state,
      hypotheses: this.hypotheses.length,
      skip: this.skip,
      only: this.only,
    };
  }
}
