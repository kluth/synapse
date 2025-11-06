import { NeuralNode } from '../core/NeuralNode';
import type { Input, Output } from '../types';

interface ReflexNeuronConfig {
  readonly id: string;
  readonly threshold: number;
}

/**
 * Reflex Neuron - Serverless function implementation
 *
 * Reflex neurons provide event-driven, ephemeral responses for simple, stateless operations.
 * Like spinal reflex arcs that respond without cortical involvement, these neurons activate
 * only when triggered, scaling to zero when idle.
 *
 * Characteristics:
 * - Stateless (no memory between invocations)
 * - Fast activation/deactivation
 * - Event-driven
 * - Designed for parallel execution
 * - Cold start optimized
 *
 * Use cases:
 * - Image processing
 * - Webhook handlers
 * - Payment processing
 * - Data transformation
 * - Any isolated, parallelizable task
 */
export class ReflexNeuron extends NeuralNode {
  constructor(config: ReflexNeuronConfig) {
    super({
      id: config.id,
      type: 'reflex',
      threshold: config.threshold,
    });
  }

  /**
   * LIFECYCLE OVERRIDES - Optimized for fast activation
   */

  public override async activate(): Promise<void> {
    // Reflex neurons activate instantly with minimal overhead
    await super.activate();
    // No state initialization needed - stateless by design
  }

  public override async deactivate(): Promise<void> {
    // Quick cleanup and scale to zero
    await super.deactivate();
    // No state to clean up
  }

  /**
   * PROCESSING OVERRIDE - Stateless execution
   */

  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: Input<TInput>,
  ): Promise<TOutput> {
    // Reflex processing is simple and stateless
    // Each invocation is independent
    // Subclasses should override for specific reflex behaviors

    // Default: echo input (transformation would happen in subclasses)
    return Promise.resolve(input.data as unknown as TOutput);
  }

  /**
   * Execute a reflex action - convenience method for one-shot processing
   * This simulates a serverless function invocation pattern
   *
   * @param input The input data
   * @returns Processing output
   */
  public async execute<TInput = unknown, TOutput = unknown>(
    input: Input<TInput>,
  ): Promise<Output<TOutput>> {
    // Activation -> Process -> Deactivation in one call
    await this.activate();

    try {
      const result = await this.process<TInput, TOutput>(input);
      return result;
    } finally {
      // Always deactivate (scale to zero)
      await this.deactivate();
    }
  }

  /**
   * Batch processing for multiple invocations
   * Simulates parallel Lambda executions
   *
   * @param inputs Array of inputs to process in parallel
   * @returns Array of outputs
   */
  public async executeBatch<TInput = unknown, TOutput = unknown>(
    inputs: Input<TInput>[],
  ): Promise<Array<Output<TOutput>>> {
    // Process all inputs in parallel (each is independent)
    return Promise.all(inputs.map((input) => this.execute<TInput, TOutput>(input)));
  }
}
