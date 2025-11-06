import type {
  Signal,
  Event,
  Input,
  Output,
  Decision,
  NodeState,
  HealthStatus,
  NeuronType,
} from '../types';
import type { INeuralNode } from '../interfaces';

interface NeuralNodeConfig {
  readonly id: string;
  readonly type: NeuronType;
  readonly threshold: number;
}

/**
 * Base implementation of a neural node.
 * This class provides the fundamental behavior for all neuron types.
 */
export class NeuralNode implements INeuralNode {
  public readonly id: string;
  public readonly type: NeuronType;
  public state: NodeState = 'inactive';
  public threshold: number;

  private signalQueue: Signal[] = [];
  private activationTime: Date | null = null;
  private errorCount = 0;
  private metricsData: Record<string, number> = {
    signalsReceived: 0,
    signalsEmitted: 0,
    processedInputs: 0,
    errors: 0,
  };

  constructor(config: NeuralNodeConfig) {
    this.id = config.id;
    this.type = config.type;
    this.threshold = config.threshold;

    this.validateThreshold();
  }

  private validateThreshold(): void {
    if (this.threshold < 0 || this.threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
  }

  /**
   * LIFECYCLE MANAGEMENT
   */

  public async activate(): Promise<void> {
    if (this.state === 'active' || this.state === 'firing') {
      throw new Error('Node is already active');
    }

    this.state = 'active';
    this.activationTime = new Date();
    this.signalQueue = [];
    this.errorCount = 0;

    return Promise.resolve();
  }

  public async deactivate(): Promise<void> {
    this.state = 'inactive';
    this.activationTime = null;
    this.signalQueue = [];

    return Promise.resolve();
  }

  public healthCheck(): HealthStatus {
    const now = Date.now();
    const uptime = this.activationTime !== null ? now - this.activationTime.getTime() : 0;

    return {
      healthy: this.state !== 'failed' && this.errorCount < 10,
      lastCheck: new Date(),
      uptime,
      errors: this.errorCount,
      metrics: { ...this.metricsData },
    };
  }

  /**
   * DENDRITE FUNCTIONS - Receive inputs
   */

  public async receive(signal: Signal): Promise<void> {
    if (this.state !== 'active' && this.state !== 'firing') {
      throw new Error('Node is not active');
    }

    this.signalQueue.push(signal);
    this.metricsData['signalsReceived'] = (this.metricsData['signalsReceived'] ?? 0) + 1;

    // Auto-process signals if queue is getting large
    if (this.signalQueue.length >= 10) {
      await this.processSignalQueue();
    }
  }

  public listen(event: Event): void {
    // Default implementation - can be overridden by subclasses
    // Convert event to signal and add to queue
    const signal: Signal = {
      id: event.id,
      sourceId: event.source,
      type: 'excitatory',
      strength: 0.5,
      payload: event.data,
      timestamp: event.timestamp,
      metadata: { correlationId: event.correlationId },
    };

    this.signalQueue.push(signal);
    this.metricsData['signalsReceived'] = (this.metricsData['signalsReceived'] ?? 0) + 1;
  }

  /**
   * SOMA FUNCTIONS - Process inputs
   */

  public async process<TInput = unknown, TOutput = unknown>(
    input: Input<TInput>,
  ): Promise<Output<TOutput>> {
    if (this.state !== 'active' && this.state !== 'firing') {
      throw new Error('Node is not active');
    }

    try {
      this.state = 'firing';
      this.metricsData['processedInputs'] = (this.metricsData['processedInputs'] ?? 0) + 1;

      // Default processing - subclasses should override
      const result = await this.executeProcessing(input);

      this.state = 'active';

      return {
        data: result as TOutput,
        success: true,
        metadata: input.metadata,
      };
    } catch (error) {
      this.errorCount++;
      this.metricsData['errors'] = (this.metricsData['errors'] ?? 0) + 1;
      this.state = this.errorCount > 10 ? 'failed' : 'active';

      return {
        data: undefined as TOutput,
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        metadata: input.metadata,
      };
    }
  }

  /**
   * Template method for actual processing logic - override in subclasses
   */
  protected async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: Input<TInput>,
  ): Promise<TOutput> {
    // Default implementation just echoes the input
    return Promise.resolve(input.data as unknown as TOutput);
  }

  public integrate(signals: Signal[]): Decision {
    let accumulated = 0;

    for (const signal of signals) {
      if (signal.type === 'excitatory') {
        accumulated += signal.strength;
      } else {
        // inhibitory
        accumulated -= signal.strength;
      }
    }

    // Ensure accumulated is not negative
    accumulated = Math.max(0, accumulated);

    const shouldFire = accumulated >= this.threshold;

    return {
      shouldFire,
      threshold: this.threshold,
      accumulated,
      reason: shouldFire
        ? `Accumulated strength ${accumulated} exceeds threshold ${this.threshold}`
        : `Accumulated strength ${accumulated} below threshold ${this.threshold}`,
    };
  }

  /**
   * AXON FUNCTIONS - Transmit outputs
   */

  public emit(_signal: Signal): void {
    if (this.state !== 'active' && this.state !== 'firing') {
      throw new Error('Node is not active');
    }

    this.metricsData['signalsEmitted'] = (this.metricsData['signalsEmitted'] ?? 0) + 1;
    // Default implementation - actual emission handled by connections
    // Signal parameter prefixed with _ to indicate intentionally unused
  }

  public async transmit(target: INeuralNode, signal: Signal): Promise<void> {
    if (this.state !== 'active' && this.state !== 'firing') {
      throw new Error('Node is not active');
    }

    this.emit(signal);
    await target.receive(signal);
  }

  /**
   * INTERNAL METHODS
   */

  private async processSignalQueue(): Promise<void> {
    if (this.signalQueue.length === 0) {
      return;
    }

    const decision = this.integrate(this.signalQueue);

    if (decision.shouldFire) {
      // Fire the neuron - process the accumulated signals
      const combinedInput: Input = {
        data: this.signalQueue.map((s) => s.payload),
        metadata: { signalCount: this.signalQueue.length },
      };

      await this.process(combinedInput);
    }

    // Clear processed signals
    this.signalQueue = [];
  }
}
