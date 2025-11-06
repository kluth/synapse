/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-useless-constructor, @typescript-eslint/no-floating-promises, @typescript-eslint/require-await */
/**
 * SensoryNeuron - Input components that capture user interactions
 * Converts DOM events to neural signals
 */

import type { VisualNeuronConfig } from './VisualNeuron';
import { VisualNeuron } from './VisualNeuron';
import type { UIEventSignal, UIEventType, ComponentProps, ComponentState } from './types';

/**
 * SensoryNeuron - Captures and processes user interactions
 * Examples: Input, Button, Select, Checkbox, etc.
 */
export abstract class SensoryNeuron<
  TProps extends ComponentProps = ComponentProps,
  TState extends ComponentState = ComponentState,
> extends VisualNeuron<TProps, TState> {
  constructor(config: VisualNeuronConfig<TProps>) {
    super(config);
  }

  /**
   * Capture a DOM interaction and convert it to a neural signal
   */
  public async captureInteraction(
    domEvent: any,
    eventType: UIEventType,
    payload: any,
    bubbles: boolean = true,
  ): Promise<void> {
    const uiSignal = this.toNeuralSignal(domEvent, eventType, payload, bubbles);

    // Convert to base Signal type for neural network transmission
    const baseSignal: {
      id: string;
      sourceId: string;
      type: 'excitatory';
      strength: number;
      payload: unknown;
      timestamp: Date;
    } = {
      id: crypto.randomUUID(),
      sourceId: this.id,
      type: 'excitatory',
      strength: uiSignal.strength,
      payload: uiSignal,
      timestamp: new Date(uiSignal.timestamp),
    };

    await this.receive(baseSignal);
  }

  /**
   * Convert DOM event to neural signal
   */
  protected toNeuralSignal(
    domEvent: any,
    eventType: UIEventType,
    payload: any,
    bubbles: boolean = true,
  ): UIEventSignal {
    // Determine signal strength based on event type
    const strength = this.getSignalStrength(eventType);

    return {
      type: eventType,
      data: {
        domEvent,
        payload,
        target: this.id,
        bubbles,
      },
      strength,
      timestamp: Date.now(),
    };
  }

  /**
   * Determine signal strength based on event type
   * Direct interactions (click, input) have higher strength
   * Indirect interactions (hover) have lower strength
   */
  protected getSignalStrength(eventType: UIEventType): number {
    const strengthMap: Record<UIEventType, number> = {
      'ui:click': 1.0,
      'ui:input': 0.9,
      'ui:change': 0.9,
      'ui:submit': 1.0,
      'ui:keydown': 0.8,
      'ui:keyup': 0.7,
      'ui:focus': 0.8,
      'ui:blur': 0.8,
      'ui:hover': 0.3,
      'ui:scroll': 0.4,
      'ui:resize': 0.5,
    };

    return strengthMap[eventType] || 0.5;
  }

  /**
   * Handle keyboard events with special key detection
   */
  protected isSpecialKey(key: string): boolean {
    const specialKeys = [
      'Enter',
      'Escape',
      'Tab',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Backspace',
      'Delete',
    ];
    return specialKeys.includes(key);
  }

  /**
   * Get refractory period for sensory neurons (debouncing)
   * Can be overridden for custom debounce timing
   */
  protected override getRefractoryPeriod(): number {
    return 16; // Default: one frame at 60fps
  }
}
