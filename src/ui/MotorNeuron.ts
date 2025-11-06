/**
 * MotorNeuron - Action components that trigger side effects
 * Handles API calls, navigation, state mutations, etc.
 */

import { VisualNeuron } from './VisualNeuron';
import type { Signal } from '../types';
import type { ComponentProps, ComponentState } from './types';
import type { NeuralNode } from '../core/NeuralNode';

interface SignalPayload {
  payload?: {
    data?: unknown;
  };
  data?: unknown;
}

/**
 * MotorNeuron - Executes actions and side effects
 * Examples: Submit buttons, navigation links, action triggers
 */
export abstract class MotorNeuron<
  TProps extends ComponentProps = ComponentProps,
  TState extends ComponentState = ComponentState,
> extends VisualNeuron<TProps, TState> {
  // Connected backend neurons (for API calls, etc.)
  protected backendConnections: Map<string, NeuralNode> = new Map();

  // Action execution state
  protected isExecuting: boolean = false;

  // Timeout for action execution (ms)
  protected actionTimeout: number = 30000; // 30 seconds default

  // Max retries for failed actions
  protected maxRetries: number = 0;

  /**
   * Connect this motor neuron to a backend neuron
   */
  public connectToBackend(neuron: NeuralNode): void {
    this.backendConnections.set(neuron.id, neuron);
  }

  /**
   * Disconnect from a backend neuron
   */
  public disconnectFromBackend(neuronId: string): void {
    this.backendConnections.delete(neuronId);
  }

  /**
   * Execute an action with error handling and lifecycle signals
   */
  protected async executeAction(signal: Signal): Promise<void> {
    if (this.isExecuting) {
      // Prevent concurrent executions
      return;
    }

    this.isExecuting = true;

    try {
      // Emit action start signal
      this.emitActionSignal('action:start', { originalSignal: signal });

      // Update state to show action in progress
      this.setState({ submitting: true, error: null } as unknown as Partial<TState>);

      // Execute with timeout
      const signalPayload = signal as unknown as SignalPayload;
      const actionData = signalPayload.payload?.data ?? signalPayload.data;
      const result = await this.executeWithTimeout(
        this.performAction(actionData),
        this.actionTimeout,
      );

      // Forward to backend neurons
      await this.forwardToBackend(signal, result);

      // Emit success signal
      this.emitActionSignal('action:complete', { result });

      // Update state
      this.setState({ submitting: false } as unknown as Partial<TState>);

      // Call success handlers
      this.onActionSuccess(result);
    } catch (error) {
      // Handle failure
      await this.handleActionError(error, signal);
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Perform the actual action - must be implemented by subclasses
   */
  public abstract performAction(data: unknown): Promise<unknown>;

  /**
   * Execute action with timeout
   */
  protected async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Action timeout')), timeout)),
    ]);
  }

  /**
   * Handle action error with retry logic
   */
  protected async handleActionError(
    error: unknown,
    signal: Signal,
    retryCount: number = 0,
  ): Promise<void> {
    if (retryCount < this.maxRetries) {
      // Retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      try {
        const signalPayload = signal as unknown as SignalPayload;
        const actionData = signalPayload.payload?.data ?? signalPayload.data;
        const result = await this.performAction(actionData);
        this.onActionSuccess(result);
        this.setState({ submitting: false } as unknown as Partial<TState>);
        return;
      } catch (retryError) {
        return this.handleActionError(retryError, signal, retryCount + 1);
      }
    }

    // Emit error signal
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Action failed';
    this.emitActionSignal('action:error', { error: errorMessage });

    // Update state
    this.setState({
      submitting: false,
      error: errorMessage,
    } as unknown as Partial<TState>);

    // Call error handler
    this.onActionError(error);
  }

  /**
   * Forward signal to connected backend neurons
   */
  protected async forwardToBackend(signal: Signal, actionResult: unknown): Promise<void> {
    const forwardSignal: Signal = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: 'excitatory',
      strength: signal.strength,
      payload: {
        originalSignal: signal,
        result: actionResult,
        source: this.id,
      },
      timestamp: new Date(),
    };

    for (const neuron of this.backendConnections.values()) {
      try {
        await neuron.receive(forwardSignal);
      } catch (error) {
        console.error(`Failed to forward to backend neuron ${neuron.id}:`, error);
      }
    }
  }

  /**
   * Emit action lifecycle signal
   */
  protected emitActionSignal(type: string, data: unknown): void {
    const actionSignal = {
      type,
      data,
      strength: 1.0,
      timestamp: Date.now(),
    };

    // Convert to base Signal type
    const baseSignal: Signal = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: 'excitatory',
      strength: 1.0,
      payload: actionSignal,
      timestamp: new Date(),
    };

    this.emit(baseSignal);
    // Also emit locally for component event listeners
    this.emitter.emit('signal', actionSignal);
  }

  /**
   * Hook: Called when action succeeds
   */
  protected onActionSuccess(result: unknown): void {
    // Check if props have an onSuccess callback
    const props = this.getProps() as { onSuccess?: (result: unknown) => void };
    if (typeof props.onSuccess === 'function') {
      props.onSuccess(result);
    }
  }

  /**
   * Hook: Called when action fails
   */
  protected onActionError(error: unknown): void {
    // Check if props have an onError callback
    const props = this.getProps() as { onError?: (error: unknown) => void };
    if (typeof props.onError === 'function') {
      props.onError(error);
    }
  }

  /**
   * Cleanup backend connections on unmount
   */
  protected override async onUnmount(): Promise<void> {
    this.backendConnections.clear();
    await super.onUnmount();
  }
}
