/**
 * TouchReceptor - Button component using Web Components
 *
 * Biological metaphor: Mechanoreceptors detect mechanical pressure
 * and touch. TouchReceptors respond to user clicks and taps.
 *
 * This component is a standards-based button using:
 * - Custom Elements API
 * - Shadow DOM for encapsulation
 * - HTML Templates for rendering
 */

import { Receptor } from './Receptor';

export interface TouchReceptorState {
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large';
  disabled: boolean;
  loading: boolean;
  pressed: boolean;
  focused: boolean;
  active: boolean;
  icon?: string;
}

/**
 * TouchReceptor - Button component for detecting touch/click interactions
 */
export class TouchReceptor extends Receptor {
  static get observedAttributes(): string[] {
    return ['label', 'variant', 'size', 'disabled', 'loading', 'icon'];
  }

  protected state: TouchReceptorState = {
    label: 'Button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false,
    pressed: false,
    focused: false,
    active: false,
  };

  constructor() {
    super();
  }

  /**
   * Get receptor type
   */
  protected getReceptorType(): string {
    return 'mechanoreceptor:touch';
  }

  /**
   * Define the button template
   */
  protected defineTemplate(): HTMLTemplateElement {
    return this.createTemplate(`
      <style>
        :host {
          display: inline-block;
          --touch-receptor-radius: 6px;
          --touch-receptor-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 2px solid transparent;
          border-radius: var(--touch-receptor-radius);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.5;
          cursor: pointer;
          user-select: none;
          transition: var(--touch-receptor-transition);
          outline: none;
        }

        /* Size variants */
        button.small {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
        }

        button.large {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        }

        /* Color variants */
        button.primary {
          background: #0066cc;
          color: white;
          border-color: #0066cc;
        }

        button.primary:hover:not(:disabled) {
          background: #0052a3;
          border-color: #0052a3;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }

        button.secondary {
          background: #64748b;
          color: white;
          border-color: #64748b;
        }

        button.secondary:hover:not(:disabled) {
          background: #475569;
          border-color: #475569;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
        }

        button.danger {
          background: #dc2626;
          color: white;
          border-color: #dc2626;
        }

        button.danger:hover:not(:disabled) {
          background: #b91c1c;
          border-color: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        button.ghost {
          background: transparent;
          color: #475569;
          border-color: #e2e8f0;
        }

        button.ghost:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* States */
        button:active:not(:disabled) {
          transform: translateY(1px);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        button:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        button.pressed {
          transform: scale(0.98);
        }

        /* Loading state */
        button.loading {
          position: relative;
          color: transparent;
          pointer-events: none;
        }

        button.loading::after {
          content: '';
          position: absolute;
          width: 1rem;
          height: 1rem;
          top: 50%;
          left: 50%;
          margin-left: -0.5rem;
          margin-top: -0.5rem;
          border: 2px solid currentColor;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spinner 0.6s linear infinite;
          color: white;
        }

        @keyframes spinner {
          to {
            transform: rotate(360deg);
          }
        }

        /* Icon */
        .icon {
          display: inline-flex;
          align-items: center;
        }
      </style>
      <button
        type="button"
        data-bind-attr="class:variant"
        data-bind-bool="disabled:disabled"
        id="button">
        <span class="label" data-bind="label"></span>
      </button>
    `);
  }

  /**
   * Handle button click
   */
  protected handleInput(event: Event): void {
    if (this.state.disabled || this.state.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Set pressed state briefly
    this.setState({ pressed: true });
    setTimeout(() => {
      this.setState({ pressed: false });
    }, 150);

    // Emit touch event with high signal strength (direct user interaction)
    this.emitReceptorEvent(
      'touch',
      {
        label: this.state.label,
        variant: this.state.variant,
        timestamp: Date.now(),
      },
      0.95, // High signal strength for direct touch
    );
  }

  /**
   * Apply data binding with size and loading classes
   */
  protected applyDataBinding(fragment: DocumentFragment): void {
    super.applyDataBinding(fragment);

    const button = fragment.querySelector('button');
    if (button) {
      // Add size class
      button.classList.add(this.state.size);

      // Toggle loading class
      if (this.state.loading) {
        button.classList.add('loading');
      } else {
        button.classList.remove('loading');
      }

      // Toggle pressed class
      if (this.state.pressed) {
        button.classList.add('pressed');
      } else {
        button.classList.remove('pressed');
      }
    }
  }

  /**
   * Attach event listeners
   */
  protected attachEventListeners(): void {
    super.attachEventListeners();

    const button = this.query<HTMLButtonElement>('#button');
    if (!button) return;

    // Touch/click event
    button.addEventListener('click', (e) => this.handleInput(e));

    // Keyboard events
    button.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleInput(e);
      }
    });

    // Mouse events for visual feedback
    button.addEventListener('mousedown', () => {
      if (!this.state.disabled && !this.state.loading) {
        this.setState({ active: true });
      }
    });

    button.addEventListener('mouseup', () => {
      this.setState({ active: false });
    });

    button.addEventListener('mouseleave', () => {
      this.setState({ active: false });
    });
  }

  /**
   * Get the focusable element
   */
  protected getFocusableElement(): Element | null {
    return this.query('button');
  }

  /**
   * Observed attribute changed callback
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    switch (name) {
      case 'label':
        this.setState({ label: newValue ?? 'Button' });
        break;
      case 'variant':
        if (
          newValue === 'primary' ||
          newValue === 'secondary' ||
          newValue === 'danger' ||
          newValue === 'ghost'
        ) {
          this.setState({ variant: newValue });
        }
        break;
      case 'size':
        if (newValue === 'small' || newValue === 'medium' || newValue === 'large') {
          this.setState({ size: newValue });
        }
        break;
      case 'disabled':
        this.setState({ disabled: newValue !== null });
        break;
      case 'loading':
        this.setState({ loading: newValue !== null });
        break;
      case 'icon':
        this.setState({ icon: newValue ?? undefined });
        break;
    }
  }

  /**
   * Public API: Set loading state
   */
  setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  /**
   * Public API: Simulate press
   */
  press(): void {
    if (this.state.disabled || this.state.loading) return;

    const button = this.query<HTMLButtonElement>('button');
    if (button) {
      button.click();
    }
  }
}

// Register the custom element
if (!customElements.get('touch-receptor')) {
  customElements.define('touch-receptor', TouchReceptor);
}
