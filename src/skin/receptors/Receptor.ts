/**
 * Receptor - Base class for input components in the Skin layer
 *
 * Biological metaphor: Receptors are specialized cells that detect
 * external stimuli (touch, pressure, temperature, pain) and convert
 * them into neural signals.
 *
 * In Synapse: Receptors detect user interactions (clicks, input, gestures)
 * and convert them into neural signals for processing.
 */

import { SkinCell } from '../cells/SkinCell';
import type { Signal } from '../../types';

export interface ReceptorState {
  disabled: boolean;
  focused: boolean;
  active: boolean;
  value?: unknown;
  [key: string]: unknown;
}

/**
 * Base class for all input/receptor components
 */
export abstract class Receptor extends SkinCell {
  protected state: ReceptorState = {
    disabled: false,
    focused: false,
    active: false,
  };

  /**
   * Get the receptor type (mechanoreceptor, thermoreceptor, etc.)
   */
  protected abstract getReceptorType(): string;

  /**
   * Handle input from user
   * Override in subclasses to process specific input types
   */
  protected abstract handleInput(event: Event): void;

  /**
   * Get the current receptor value
   */
  get value(): unknown {
    return this.state.value;
  }

  /**
   * Set the receptor value
   */
  set value(val: unknown) {
    this.setState({ value: val });
  }

  /**
   * Enable the receptor
   */
  enable(): void {
    this.setState({ disabled: false });
  }

  /**
   * Disable the receptor
   */
  disable(): void {
    this.setState({ disabled: true });
  }

  /**
   * Check if receptor is disabled
   */
  get disabled(): boolean {
    return this.state.disabled;
  }

  /**
   * Focus the receptor
   */
  focus(): void {
    const element = this.getFocusableElement();
    if (element instanceof HTMLElement) {
      element.focus();
    }
  }

  /**
   * Blur the receptor
   */
  blur(): void {
    const element = this.getFocusableElement();
    if (element instanceof HTMLElement) {
      element.blur();
    }
  }

  /**
   * Get the focusable element in the shadow DOM
   * Override in subclasses to return the specific input element
   */
  protected getFocusableElement(): Element | null {
    return this.query('input, button, textarea, select');
  }

  /**
   * Convert DOM event to neural signal
   */
  protected convertToNeuralSignal(event: Event, signalStrength: number = 0.8): Signal {
    return {
      type: `receptor:${this.getReceptorType()}:${event.type}`,
      data: {
        receptorType: this.getReceptorType(),
        eventType: event.type,
        value: this.value,
        timestamp: Date.now(),
        target: this,
      },
      strength: signalStrength,
      metadata: {
        source: this.tagName.toLowerCase(),
        domEvent: event,
      },
    };
  }

  /**
   * Emit receptor event with neural signal
   */
  protected emitReceptorEvent(
    eventName: string,
    detail?: unknown,
    signalStrength: number = 0.8,
  ): void {
    // Emit standard DOM event
    this.emitEvent(eventName, detail);

    // Emit neural signal
    this.emitNeuralSignal(
      `receptor:${this.getReceptorType()}:${eventName}`,
      detail ?? this.value,
      signalStrength,
    );
  }

  /**
   * Handle focus event
   */
  protected handleFocus(_event: FocusEvent): void {
    this.setState({ focused: true });
    this.emitReceptorEvent('focus', undefined, 0.5);
  }

  /**
   * Handle blur event
   */
  protected handleBlur(_event: FocusEvent): void {
    this.setState({ focused: false });
    this.emitReceptorEvent('blur', undefined, 0.3);
  }

  /**
   * Attach standard receptor event listeners
   */
  protected attachReceptorListeners(): void {
    const element = this.getFocusableElement();
    if (!element) return;

    element.addEventListener('focus', (e) => this.handleFocus(e as FocusEvent));
    element.addEventListener('blur', (e) => this.handleBlur(e as FocusEvent));
  }

  /**
   * Override onMount to attach receptor listeners
   */
  protected onMount(): void {
    super.onMount();
    this.attachReceptorListeners();
  }
}
