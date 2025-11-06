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

/**
 * Core neural node interface representing a processing unit in the Synapse framework.
 * Each node mimics a biological neuron with dendrites (input), soma (processing), and axon (output).
 */
export interface INeuralNode {
  /** Unique identifier for this node */
  readonly id: string;

  /** Type of neuron (cortical or reflex) */
  readonly type: NeuronType;

  /** Current operational state */
  state: NodeState;

  /** Activation threshold - signals must exceed this to trigger firing */
  threshold: number;

  /**
   * DENDRITE FUNCTIONS - Receive inputs
   */

  /**
   * Receive a signal from another neuron
   * @param signal The incoming signal
   */
  receive(signal: Signal): Promise<void>;

  /**
   * Listen for specific event types
   * @param event The event to process
   */
  listen(event: Event): void;

  /**
   * SOMA FUNCTIONS - Process inputs
   */

  /**
   * Process input data and produce output
   * @param input The input to process
   * @returns Processing result
   */
  process<TInput = unknown, TOutput = unknown>(input: Input<TInput>): Promise<Output<TOutput>>;

  /**
   * Integrate multiple signals and decide whether to fire
   * @param signals Array of signals to integrate
   * @returns Decision on whether to fire
   */
  integrate(signals: Signal[]): Decision;

  /**
   * AXON FUNCTIONS - Transmit outputs
   */

  /**
   * Emit a signal to connected neurons
   * @param signal The signal to emit
   */
  emit(signal: Signal): void;

  /**
   * Transmit directly to a specific target node
   * @param target The target neural node
   * @param signal The signal to transmit
   */
  transmit(target: INeuralNode, signal: Signal): Promise<void>;

  /**
   * LIFECYCLE MANAGEMENT
   */

  /**
   * Activate the neuron and prepare for processing
   */
  activate(): Promise<void>;

  /**
   * Deactivate the neuron and cleanup resources
   */
  deactivate(): Promise<void>;

  /**
   * Check the health status of this neuron
   * @returns Current health status
   */
  healthCheck(): HealthStatus;
}
