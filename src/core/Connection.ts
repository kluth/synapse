import type { Signal, ConnectionType, TransmissionSpeed, Protocol } from '../types';
import type { IConnection, INeuralNode } from '../interfaces';

interface ConnectionConfig {
  readonly id: string;
  readonly source: INeuralNode;
  readonly target: INeuralNode;
  weight: number;
  readonly type: ConnectionType;
  readonly speed: TransmissionSpeed;
  readonly protocol: Protocol;
}

/**
 * Connection - Synaptic connection between neural nodes
 *
 * Models a biological synapse with:
 * - Signal transmission
 * - Synaptic plasticity (strengthening/weakening)
 * - Pruning of unused connections
 * - Variable transmission speeds
 * - Multiple protocols
 */
export class Connection implements IConnection {
  public readonly id: string;
  public readonly source: INeuralNode;
  public readonly target: INeuralNode;
  public weight: number;
  public readonly type: ConnectionType;
  public readonly speed: TransmissionSpeed;
  public readonly protocol: Protocol;
  public usageCount = 0;
  public lastUsed: Date | null = null;

  private readonly minWeight = 0;
  private readonly maxWeight = 1;
  private readonly strengthenIncrement = 0.05;
  private readonly weakenDecrement = 0.05;
  private readonly pruningThresholdDays = 30;
  private readonly pruningMinUsage = 5;

  constructor(config: ConnectionConfig) {
    this.id = config.id;
    this.source = config.source;
    this.target = config.target;
    this.weight = config.weight;
    this.type = config.type;
    this.speed = config.speed;
    this.protocol = config.protocol;

    this.validateWeight();
  }

  private validateWeight(): void {
    if (this.weight < this.minWeight || this.weight > this.maxWeight) {
      throw new Error('Weight must be between 0 and 1');
    }
  }

  /**
   * TRANSMISSION
   */

  public async transmit(signal: Signal): Promise<void> {
    // Track usage
    this.usageCount++;
    this.lastUsed = new Date();

    // Apply weight to signal strength
    const amplifiedSignal: Signal = {
      ...signal,
      strength: this.applyWeight(signal.strength),
      targetId: this.target.id,
      metadata: {
        ...signal.metadata,
        connectionId: this.id,
        weight: this.weight,
        protocol: this.protocol,
      },
    };

    // Transmit based on speed and protocol
    await this.performTransmission(amplifiedSignal);
  }

  private applyWeight(signalStrength: number): number {
    // Amplify signal by connection weight
    const amplified = signalStrength * this.weight;

    // Ensure it stays in valid range
    return Math.max(0, Math.min(1, amplified));
  }

  private async performTransmission(signal: Signal): Promise<void> {
    // Simulate transmission delay based on speed
    const delay = this.getTransmissionDelay();

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Deliver signal to target
    await this.target.receive(signal);
  }

  private getTransmissionDelay(): number {
    switch (this.speed) {
      case 'fast':
        return 0; // Immediate (like glutamate synapses)
      case 'myelinated':
        return 1; // Very fast (saltatory conduction)
      case 'slow':
        return 10; // Slower (unmyelinated axons)
      default:
        return 0;
    }
  }

  /**
   * SYNAPTIC PLASTICITY
   */

  public strengthen(): void {
    // Long-term potentiation
    this.weight = Math.min(this.maxWeight, this.weight + this.strengthenIncrement);
  }

  public weaken(): void {
    // Synaptic depression
    this.weight = Math.max(this.minWeight, this.weight - this.weakenDecrement);
  }

  public prune(): void {
    // Mark connection for removal by setting weight to 0
    this.weight = this.minWeight;
  }

  public shouldPrune(): boolean {
    if (this.lastUsed === null) {
      // Never used - could be pruned
      return true;
    }

    const daysSinceLastUse = this.getDaysSinceLastUse();

    // Prune if:
    // 1. Not used in threshold period AND low usage count
    // 2. Weight has degraded to zero
    const isStale = daysSinceLastUse > this.pruningThresholdDays;
    const isUnderutilized = this.usageCount < this.pruningMinUsage;
    const isWeightZero = this.weight === this.minWeight;

    return (isStale && isUnderutilized) || isWeightZero;
  }

  private getDaysSinceLastUse(): number {
    if (this.lastUsed === null) {
      return Infinity;
    }

    const now = Date.now();
    const lastUsedTime = this.lastUsed.getTime();
    const diffMs = now - lastUsedTime;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays;
  }

  /**
   * ADAPTIVE PLASTICITY
   */

  /**
   * Automatically adjust weight based on usage patterns
   * Called after transmission to implement Hebbian learning
   */
  public adaptWeight(): void {
    // "Neurons that fire together, wire together"
    // Strengthen frequently used connections
    if (this.usageCount > 10 && this.weight < this.maxWeight) {
      this.strengthen();
    }

    // Weaken rarely used connections
    const daysSinceLastUse = this.getDaysSinceLastUse();
    if (daysSinceLastUse > 7 && this.weight > this.minWeight) {
      this.weaken();
    }
  }
}
