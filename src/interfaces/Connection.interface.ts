import type { Signal, ConnectionType, TransmissionSpeed, Protocol } from '../types';
import type { INeuralNode } from './NeuralNode.interface';

/**
 * Represents a synaptic connection between two neural nodes.
 * Connections can strengthen with use (potentiation) or weaken with disuse.
 */
export interface IConnection {
  /** Unique identifier for this connection */
  readonly id: string;

  /** Source neuron */
  readonly source: INeuralNode;

  /** Target neuron */
  readonly target: INeuralNode;

  /** Signal amplification factor (0-1) */
  weight: number;

  /** Connection behavior type */
  readonly type: ConnectionType;

  /** Transmission speed category */
  readonly speed: TransmissionSpeed;

  /** Communication protocol */
  readonly protocol: Protocol;

  /** Number of times this connection has been used */
  usageCount: number;

  /** Last time this connection was used */
  lastUsed: Date | null;

  /**
   * Transmit a signal from source to target
   * @param signal The signal to transmit
   */
  transmit(signal: Signal): Promise<void>;

  /**
   * Strengthen the connection (increase weight)
   * Mimics long-term potentiation
   */
  strengthen(): void;

  /**
   * Weaken the connection (decrease weight)
   * Mimics synaptic depression
   */
  weaken(): void;

  /**
   * Prune (remove) this connection
   * Used for connections with very low usage
   */
  prune(): void;

  /**
   * Check if this connection should be pruned based on usage
   * @returns true if connection should be removed
   */
  shouldPrune(): boolean;
}
