import { NeuralNode } from '../core/NeuralNode';
import type { Input } from '../types';

interface CorticalNeuronConfig {
  readonly id: string;
  readonly threshold: number;
}

/**
 * Cortical Neuron - Stateful microservice implementation
 *
 * Cortical neurons handle complex, multi-step processing requiring memory and sustained activation.
 * They maintain state across requests and provide persistent processing capabilities.
 *
 * Use cases:
 * - User authentication services
 * - Order processing engines
 * - Recommendation systems
 * - Any service requiring sustained context
 */
export class CorticalNeuron extends NeuralNode {
  private internalState: Map<string, unknown> = new Map();
  private workingMemory: Map<string, unknown> = new Map();
  private readonly maxMemorySize = 100; // LRU cache size
  private memoryAccessOrder: string[] = [];

  constructor(config: CorticalNeuronConfig) {
    super({
      id: config.id,
      type: 'cortical',
      threshold: config.threshold,
    });
  }

  /**
   * STATE MANAGEMENT
   */

  /**
   * Set internal state value
   * @param key State key
   * @param value State value
   */
  public setState<T = unknown>(key: string, value: T): void {
    this.internalState.set(key, value);
  }

  /**
   * Get internal state value
   * @param key Optional key - if not provided, returns all state
   * @returns State value or entire state object
   */
  public getState<T = unknown>(key?: string): T | Record<string, unknown> {
    if (key === undefined) {
      return Object.fromEntries(this.internalState);
    }
    return this.internalState.get(key) as T;
  }

  /**
   * Clear all internal state
   */
  public clearState(): void {
    this.internalState.clear();
  }

  /**
   * MEMORY MANAGEMENT - Working Memory (LRU Cache)
   */

  /**
   * Store a value in working memory with LRU eviction
   * @param key Memory key
   * @param value Memory value
   */
  public remember<T = unknown>(key: string, value: T): void {
    // Update access order
    this.updateAccessOrder(key);

    // Store in memory
    this.workingMemory.set(key, value);

    // Enforce memory limit (LRU eviction)
    if (this.workingMemory.size > this.maxMemorySize) {
      const oldestKey = this.memoryAccessOrder.shift();
      if (oldestKey !== undefined) {
        this.workingMemory.delete(oldestKey);
      }
    }
  }

  /**
   * Recall a value from working memory
   * @param key Memory key
   * @returns Stored value or undefined
   */
  public recall<T = unknown>(key: string): T | undefined {
    if (this.workingMemory.has(key)) {
      // Update access order on read (LRU)
      this.updateAccessOrder(key);
      return this.workingMemory.get(key) as T;
    }
    return undefined;
  }

  /**
   * Clear working memory
   */
  public forget(): void {
    this.workingMemory.clear();
    this.memoryAccessOrder = [];
  }

  /**
   * LIFECYCLE OVERRIDES
   */

  public override async activate(): Promise<void> {
    await super.activate();
    // Cortical neurons maintain baseline activity
    this.internalState.clear();
    this.workingMemory.clear();
    this.memoryAccessOrder = [];
  }

  public override async deactivate(): Promise<void> {
    // Clear state on deactivation
    this.clearState();
    this.forget();
    await super.deactivate();
  }

  /**
   * PROCESSING OVERRIDE
   */

  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: Input<TInput>,
  ): Promise<TOutput> {
    // Track process count in state
    const currentCount = this.getState<number>('processCount');
    const processCount = typeof currentCount === 'number' ? currentCount + 1 : 1;
    this.setState('processCount', processCount);

    // Remember last input
    this.remember('lastInput', input.data);

    // Default cortical processing - subclasses should override
    return Promise.resolve(input.data as unknown as TOutput);
  }

  /**
   * INTERNAL METHODS
   */

  private updateAccessOrder(key: string): void {
    // Remove existing entry
    const existingIndex = this.memoryAccessOrder.indexOf(key);
    if (existingIndex > -1) {
      this.memoryAccessOrder.splice(existingIndex, 1);
    }

    // Add to end (most recently used)
    this.memoryAccessOrder.push(key);
  }
}
