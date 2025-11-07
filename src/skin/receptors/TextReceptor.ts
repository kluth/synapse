/**
 * TextReceptor - Text input component using Web Components
 *
 * Biological metaphor: Chemoreceptors detect chemical signals.
 * TextReceptors receive text/data input from users.
 *
 * This component is a standards-based text input using:
 * - Custom Elements API
 * - Shadow DOM for encapsulation
 * - HTML Templates for rendering
 */

import { Receptor } from './Receptor';

export interface TextReceptorState {
  value: string;
  placeholder: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  disabled: boolean;
  required: boolean;
  readonly: boolean;
  focused: boolean;
  active: boolean;
  error?: string;
  maxLength?: number;
}

/**
 * TextReceptor - Input field component for text entry
 */
export class TextReceptor extends Receptor {
  static get observedAttributes(): string[] {
    return [
      'value',
      'placeholder',
      'type',
      'disabled',
      'required',
      'readonly',
      'error',
      'maxlength',
    ];
  }

  protected state: TextReceptorState = {
    value: '',
    placeholder: '',
    type: 'text',
    disabled: false,
    required: false,
    readonly: false,
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
    return 'chemoreceptor:text';
  }

  /**
   * Define the input template
   */
  protected defineTemplate(): HTMLTemplateElement {
    return this.createTemplate(`
      <style>
        :host {
          display: block;
          --text-receptor-radius: 6px;
          --text-receptor-border: #cbd5e1;
          --text-receptor-focus: #0066cc;
          --text-receptor-error: #dc2626;
          --text-receptor-transition: all 0.2s ease;
        }

        .container {
          position: relative;
        }

        input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #1e293b;
          background-color: #ffffff;
          border: 2px solid var(--text-receptor-border);
          border-radius: var(--text-receptor-radius);
          outline: none;
          transition: var(--text-receptor-transition);
          box-sizing: border-box;
        }

        input::placeholder {
          color: #94a3b8;
        }

        input:hover:not(:disabled):not(:read-only) {
          border-color: #94a3b8;
        }

        input:focus {
          border-color: var(--text-receptor-focus);
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        input:disabled {
          background-color: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        input:read-only {
          background-color: #f8fafc;
          cursor: default;
        }

        input.error {
          border-color: var(--text-receptor-error);
        }

        input.error:focus {
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .error-message {
          display: none;
          margin-top: 0.375rem;
          font-size: 0.8125rem;
          color: var(--text-receptor-error);
        }

        .error-message.visible {
          display: block;
        }

        .char-count {
          position: absolute;
          right: 0.75rem;
          bottom: -1.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }
      </style>
      <div class="container">
        <input
          id="input"
          data-bind-attr="type:type,placeholder:placeholder,value:value"
          data-bind-bool="disabled:disabled,required:required,readonly:readonly"
        />
        <div class="error-message" id="error"></div>
        <div class="char-count" id="char-count"></div>
      </div>
    `);
  }

  /**
   * Handle input changes
   */
  protected handleInput(event: Event): void {
    if (this.state.disabled || this.state.readonly) {
      return;
    }

    const target = event.target as HTMLInputElement;
    const newValue = target.value;

    // Update state
    this.setState({ value: newValue });

    // Emit data-input event
    this.emitReceptorEvent(
      'data-input',
      {
        value: newValue,
        type: this.state.type,
        timestamp: Date.now(),
      },
      0.7, // Moderate signal strength for text input
    );

    // Update character count if maxLength is set
    if (this.state.maxLength !== undefined) {
      this.updateCharCount();
    }
  }

  /**
   * Apply data binding with error state
   */
  protected applyDataBinding(fragment: DocumentFragment): void {
    super.applyDataBinding(fragment);

    const input = fragment.querySelector('input');
    const errorMessage = fragment.querySelector('#error');

    if (input) {
      // Add error class if error exists
      if (this.state.error) {
        input.classList.add('error');
      } else {
        input.classList.remove('error');
      }

      // Set maxlength if specified
      if (this.state.maxLength !== undefined) {
        input.setAttribute('maxlength', String(this.state.maxLength));
      }
    }

    // Show error message if exists
    if (errorMessage && this.state.error) {
      errorMessage.textContent = this.state.error;
      errorMessage.classList.add('visible');
    }

    // Update character count
    if (this.state.maxLength !== undefined) {
      this.updateCharCount();
    }
  }

  /**
   * Update character count display
   */
  private updateCharCount(): void {
    const charCount = this.query('#char-count');
    if (charCount && this.state.maxLength !== undefined) {
      const remaining = this.state.maxLength - this.state.value.length;
      charCount.textContent = `${this.state.value.length}/${this.state.maxLength}`;

      if (remaining <= 0) {
        charCount.style.color = '#dc2626';
      } else if (remaining <= 10) {
        charCount.style.color = '#f59e0b';
      } else {
        charCount.style.color = '#94a3b8';
      }
    }
  }

  /**
   * Attach event listeners
   */
  protected attachEventListeners(): void {
    super.attachEventListeners();

    const input = this.query<HTMLInputElement>('#input');
    if (!input) return;

    // Input event
    input.addEventListener('input', (e) => this.handleInput(e));

    // Change event (for validation)
    input.addEventListener('change', () => {
      this.emitReceptorEvent(
        'change',
        {
          value: this.state.value,
          valid: this.validate(),
        },
        0.8,
      );
    });

    // Clear error on focus
    input.addEventListener('focus', () => {
      if (this.state.error) {
        this.setState({ error: undefined });
      }
    });
  }

  /**
   * Get the focusable element
   */
  protected getFocusableElement(): Element | null {
    return this.query('input');
  }

  /**
   * Validate input value
   */
  private validate(): boolean {
    const input = this.query<HTMLInputElement>('input');
    if (!input) return true;

    // Check HTML5 validation
    if (!input.checkValidity()) {
      return false;
    }

    // Check required
    if (this.state.required && !this.state.value.trim()) {
      return false;
    }

    return true;
  }

  /**
   * Observed attribute changed callback
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    switch (name) {
      case 'value':
        this.setState({ value: newValue ?? '' });
        break;
      case 'placeholder':
        this.setState({ placeholder: newValue ?? '' });
        break;
      case 'type':
        if (
          newValue === 'text' ||
          newValue === 'email' ||
          newValue === 'password' ||
          newValue === 'tel' ||
          newValue === 'url' ||
          newValue === 'search'
        ) {
          this.setState({ type: newValue });
        }
        break;
      case 'disabled':
        this.setState({ disabled: newValue !== null });
        break;
      case 'required':
        this.setState({ required: newValue !== null });
        break;
      case 'readonly':
        this.setState({ readonly: newValue !== null });
        break;
      case 'error':
        this.setState({ error: newValue ?? undefined });
        break;
      case 'maxlength':
        this.setState({
          maxLength: newValue !== null ? parseInt(newValue, 10) : undefined,
        });
        break;
    }
  }

  /**
   * Public API: Set error message
   */
  setError(message: string): void {
    this.setState({ error: message });
  }

  /**
   * Public API: Clear error
   */
  clearError(): void {
    this.setState({ error: undefined });
  }

  /**
   * Public API: Check if valid
   */
  isValid(): boolean {
    return this.validate();
  }

  /**
   * Public API: Get current value
   */
  getValue(): string {
    return this.state.value;
  }

  /**
   * Public API: Set value
   */
  setValue(value: string): void {
    this.setState({ value });

    // Also update the input element
    const input = this.query<HTMLInputElement>('input');
    if (input) {
      input.value = value;
    }
  }
}

// Register the custom element
if (!customElements.get('text-receptor')) {
  customElements.define('text-receptor', TextReceptor);
}
