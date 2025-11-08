/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-useless-constructor */
import type { Heart } from '../core/Heart';

/**
 * Saga step
 */
export interface SagaStep {
  name: string;
  action: () => Promise<any>;
  compensate: () => Promise<void>;
}

/**
 * Saga result
 */
export interface SagaResult {
  success: boolean;
  error?: string;
  results?: any[];
}

/**
 * State change handler
 */
type StateChangeHandler = (state: string) => void;

/**
 * Saga - Saga pattern for distributed transactions
 *
 * Features:
 * - Sequential step execution
 * - Automatic compensation on failure
 * - State tracking
 * - Result aggregation
 */
export class Saga {
  private stateHandlers: StateChangeHandler[] = [];

  constructor(_heart: Heart) {
    // Heart instance stored for future extensions
  }

  /**
   * Execute saga steps
   */
  public async execute(steps: SagaStep[]): Promise<SagaResult> {
    const results: any[] = [];
    const executedSteps: SagaStep[] = [];

    this.emitStateChange('started');

    try {
      // Execute steps sequentially
      for (const step of steps) {
        this.emitStateChange(`executing:${step.name}`);

        const result = await step.action();
        results.push(result);
        executedSteps.push(step);
      }

      this.emitStateChange('completed');

      return {
        success: true,
        results,
      };
    } catch (error) {
      // Failure - compensate in reverse order
      this.emitStateChange('compensating');

      for (let i = executedSteps.length - 1; i >= 0; i--) {
        const step = executedSteps[i];
        if (step) {
          try {
            await step.compensate();
          } catch {
            // Log compensation failure but continue
          }
        }
      }

      this.emitStateChange('failed');

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Register state change handler
   */
  public onStateChange(handler: StateChangeHandler): void {
    this.stateHandlers.push(handler);
  }

  /**
   * Emit state change
   */
  private emitStateChange(state: string): void {
    for (const handler of this.stateHandlers) {
      try {
        handler(state);
      } catch {
        // Ignore handler errors
      }
    }
  }
}
