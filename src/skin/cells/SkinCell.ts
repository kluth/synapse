/**
 * SkinCell - Base class for all Skin layer UI components
 *
 * Represents a cell in the organism's skin (integumentary system).
 * Uses Web Components standards: Custom Elements, Shadow DOM, HTML Templates.
 *
 * Biological metaphor: Skin cells form the interface between the organism
 * and the external environment, detecting stimuli and displaying state.
 */

export interface SkinCellState {
  [key: string]: unknown;
}

export interface SkinCellProps {
  [key: string]: unknown;
}

/**
 * Base class for all Skin components using Web Components
 */
export abstract class SkinCell extends HTMLElement {
  protected shadowRoot!: ShadowRoot;
  protected state: SkinCellState = {};
  protected template?: HTMLTemplateElement;
  private _isConnected = false;
  private _observers: Map<string, Set<(value: unknown) => void>> = new Map();

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({
      mode: 'open',
      delegatesFocus: true, // Delegate focus to first focusable element
    });
  }

  /**
   * Called when element is added to the DOM
   * Web Components standard lifecycle method
   */
  connectedCallback(): void {
    if (this._isConnected) return;
    this._isConnected = true;

    this.template = this.defineTemplate();
    this.render();
    this.onMount();
  }

  /**
   * Called when element is removed from the DOM
   * Web Components standard lifecycle method
   */
  disconnectedCallback(): void {
    if (!this._isConnected) return;
    this._isConnected = false;

    this.onUnmount();
    this.cleanup();
  }

  /**
   * Define the HTML template for this component
   * Override in subclasses
   */
  protected abstract defineTemplate(): HTMLTemplateElement;

  /**
   * Render the component
   * Standard Web Components rendering using template cloning
   */
  protected render(): void {
    if (!this.template) return;

    // Clear shadow root
    this.shadowRoot.innerHTML = '';

    // Clone template content (W3C standard)
    const instance = this.template.content.cloneNode(true) as DocumentFragment;

    // Apply data binding
    this.applyDataBinding(instance);

    // Append to shadow root
    this.shadowRoot.appendChild(instance);

    // Re-attach event listeners after render
    this.attachEventListeners();
  }

  /**
   * Apply data binding to the template
   * Uses standard DOM APIs with data-bind attributes
   */
  protected applyDataBinding(fragment: DocumentFragment): void {
    // Bind text content
    const boundElements = fragment.querySelectorAll('[data-bind]');
    boundElements.forEach((el) => {
      const bindPath = el.getAttribute('data-bind');
      if (!bindPath) return;

      const value = this.getStateValue(bindPath);
      if (el instanceof HTMLElement) {
        el.textContent = String(value ?? '');
      }
    });

    // Bind attributes
    const boundAttrs = fragment.querySelectorAll('[data-bind-attr]');
    boundAttrs.forEach((el) => {
      const bindings = el.getAttribute('data-bind-attr');
      if (!bindings) return;

      // Parse format: "href:url,title:tooltipText,class:variant"
      bindings.split(',').forEach((binding) => {
        const [attr, path] = binding.split(':').map((s) => s.trim());
        const value = this.getStateValue(path);

        if (attr && value !== undefined && value !== null) {
          el.setAttribute(attr, String(value));
        }
      });
    });

    // Bind boolean attributes (disabled, hidden, etc.)
    const boundBoolAttrs = fragment.querySelectorAll('[data-bind-bool]');
    boundBoolAttrs.forEach((el) => {
      const bindings = el.getAttribute('data-bind-bool');
      if (!bindings) return;

      // Parse format: "disabled:isDisabled,hidden:isHidden"
      bindings.split(',').forEach((binding) => {
        const [attr, path] = binding.split(':').map((s) => s.trim());
        const value = this.getStateValue(path);

        if (attr) {
          if (value) {
            el.setAttribute(attr, '');
          } else {
            el.removeAttribute(attr);
          }
        }
      });
    });
  }

  /**
   * Get nested state value by path (e.g., "user.email")
   */
  protected getStateValue(path: string): unknown {
    return path.split('.').reduce((obj: Record<string, unknown> | unknown, key) => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, this.state as unknown);
  }

  /**
   * Update component state and trigger re-render
   */
  protected setState(updates: Partial<SkinCellState>): void {
    const oldState = { ...this.state };
    Object.assign(this.state, updates);

    // Notify observers
    Object.keys(updates).forEach((key) => {
      this.notifyObservers(key, updates[key]);
    });

    // Check if we should update
    if (this.shouldUpdate(oldState, this.state)) {
      this.render();
    }
  }

  /**
   * Determine if component should re-render
   * Override for optimization
   */
  protected shouldUpdate(_oldState: SkinCellState, _newState: SkinCellState): boolean {
    return true;
  }

  /**
   * Subscribe to state changes
   */
  protected subscribe(key: string, callback: (value: unknown) => void): () => void {
    if (!this._observers.has(key)) {
      this._observers.set(key, new Set());
    }
    this._observers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this._observers.get(key)?.delete(callback);
    };
  }

  /**
   * Notify observers of state changes
   */
  private notifyObservers(key: string, value: unknown): void {
    this._observers.get(key)?.forEach((callback) => callback(value));
  }

  /**
   * Attach event listeners to shadow DOM elements
   * Override in subclasses to add custom event handling
   */
  protected attachEventListeners(): void {
    // Override in subclasses
  }

  /**
   * Emit a custom event (standard Web Components API)
   */
  protected emitEvent<T = unknown>(
    eventName: string,
    detail?: T,
    options?: Omit<CustomEventInit<T>, 'detail'>,
  ): boolean {
    return this.dispatchEvent(
      new CustomEvent<T>(eventName, {
        bubbles: true,
        composed: true, // Cross shadow DOM boundaries
        cancelable: true,
        ...options,
        detail,
      }),
    );
  }

  /**
   * Emit a neural signal (integration with Synapse neural network)
   */
  protected emitNeuralSignal(signalType: string, data: unknown, strength: number = 1.0): void {
    this.emitEvent('neural-signal', {
      type: signalType,
      data,
      strength,
      timestamp: Date.now(),
      source: this,
    });
  }

  /**
   * Lifecycle: Called when component is mounted
   * Override in subclasses
   */
  protected onMount(): void {
    // Override in subclasses
  }

  /**
   * Lifecycle: Called when component is unmounted
   * Override in subclasses
   */
  protected onUnmount(): void {
    // Override in subclasses
  }

  /**
   * Cleanup resources
   */
  protected cleanup(): void {
    this._observers.clear();
  }

  /**
   * Utility: Create a template element from HTML string
   */
  protected createTemplate(html: string): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template;
  }

  /**
   * Utility: Query element in shadow root
   */
  protected query<T extends Element = Element>(selector: string): T | null {
    return this.shadowRoot.querySelector<T>(selector);
  }

  /**
   * Utility: Query all elements in shadow root
   */
  protected queryAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    return this.shadowRoot.querySelectorAll<T>(selector);
  }
}
