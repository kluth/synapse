# Synapse Skin Layer: Standards-Based Templating

## Overview

This document outlines a **100% web standards-based** templating solution for Synapse's Skin layer, using:

✅ **Web Components** (Custom Elements API)
✅ **HTML `<template>` element** (W3C Standard)
✅ **Shadow DOM** (W3C Standard)
✅ **ES6 Template Literals** (ECMAScript Standard)
✅ **Template Instantiation API** (WICG Proposal - future enhancement)

**Zero proprietary dependencies. Zero JSX. Zero build tools required.**

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Synapse Skin (Web Components)           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   SkinCell (extends HTMLElement)         │  │
│  │   - Shadow DOM encapsulation             │  │
│  │   - Template-based rendering             │  │
│  │   - Reactive attribute observation       │  │
│  └──────────────────────────────────────────┘  │
│         ▲                   ▲                   │
│         │                   │                   │
│  ┌──────┴──────┐     ┌──────┴──────────┐       │
│  │  Receptors  │     │    Effectors     │       │
│  │  (Input)    │     │    (Output)      │       │
│  └─────────────┘     └──────────────────┘       │
│                                                 │
│  Standards Used:                                │
│  • Custom Elements v1                           │
│  • Shadow DOM v1                                │
│  • HTML Templates                               │
│  • MutationObserver                             │
│  • Template Literals                            │
└─────────────────────────────────────────────────┘
```

## 1. Core Template System

### Option A: HTML `<template>` Element (Pure Standard)

```typescript
/**
 * Base SkinCell using standard HTML templates
 */
export abstract class SkinCell extends HTMLElement {
  protected shadowRoot!: ShadowRoot;
  protected state: Record<string, any> = {};
  protected template?: HTMLTemplateElement;

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
  }

  /**
   * Define template using standard HTML template element
   */
  protected abstract defineTemplate(): HTMLTemplateElement;

  connectedCallback(): void {
    this.template = this.defineTemplate();
    this.render();
  }

  /**
   * Standard-based rendering using template cloning
   */
  protected render(): void {
    if (!this.template) return;

    // Clear shadow root
    this.shadowRoot.innerHTML = '';

    // Clone template content (standard API)
    const instance = this.template.content.cloneNode(true) as DocumentFragment;

    // Apply data binding
    this.applyDataBinding(instance);

    // Append to shadow root
    this.shadowRoot.appendChild(instance);
  }

  /**
   * Manual data binding using standard DOM APIs
   */
  protected applyDataBinding(fragment: DocumentFragment): void {
    // Find all elements with data-bind attribute
    const boundElements = fragment.querySelectorAll('[data-bind]');

    boundElements.forEach((el) => {
      const bindPath = el.getAttribute('data-bind');
      if (!bindPath) return;

      const value = this.getStateValue(bindPath);

      if (el instanceof HTMLElement) {
        el.textContent = String(value ?? '');
      }
    });

    // Find all elements with data-bind-attr
    const boundAttrs = fragment.querySelectorAll('[data-bind-attr]');

    boundAttrs.forEach((el) => {
      const bindings = el.getAttribute('data-bind-attr');
      if (!bindings) return;

      // Parse format: "href:url,title:tooltipText"
      bindings.split(',').forEach((binding) => {
        const [attr, path] = binding.split(':').map(s => s.trim());
        const value = this.getStateValue(path);
        el.setAttribute(attr, String(value ?? ''));
      });
    });
  }

  /**
   * Get nested state value by path (e.g., "user.email")
   */
  protected getStateValue(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  /**
   * Update state and trigger re-render
   */
  protected setState(updates: Record<string, any>): void {
    Object.assign(this.state, updates);
    this.render();
  }
}
```

### Example Usage: HTML Template-Based Button

```typescript
/**
 * TouchReceptor (Button) using HTML templates
 */
export class TouchReceptor extends SkinCell {
  static get observedAttributes() {
    return ['label', 'variant', 'disabled'];
  }

  constructor() {
    super();
    this.state = {
      label: 'Button',
      variant: 'primary',
      disabled: false,
      pressed: false
    };
  }

  protected defineTemplate(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-family: system-ui;
          transition: all 0.2s;
        }
        .primary { background: #0066cc; color: white; }
        .secondary { background: #666; color: white; }
        .danger { background: #cc0000; color: white; }
        button:hover:not(:disabled) { transform: translateY(-1px); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        button:active:not(:disabled) { transform: translateY(1px); }
      </style>
      <button
        class=""
        data-bind-attr="class:variant"
        type="button">
        <span data-bind="label"></span>
      </button>
    `;
    return template;
  }

  connectedCallback(): void {
    super.connectedCallback();

    // Add event listener using standard DOM API
    const button = this.shadowRoot.querySelector('button');
    button?.addEventListener('click', () => this.handleClick());
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    this.setState({ [name]: newValue === 'true' ? true : newValue });
  }

  private handleClick(): void {
    if (this.state.disabled) return;

    // Emit custom event (standard API)
    this.dispatchEvent(new CustomEvent('touch', {
      bubbles: true,
      composed: true,
      detail: { receptor: this }
    }));
  }
}

// Register the custom element (standard API)
customElements.define('touch-receptor', TouchReceptor);
```

### Option B: ES6 Template Literals (Tagged Templates)

```typescript
/**
 * HTML template tag function (pure JavaScript standard)
 */
function html(strings: TemplateStringsArray, ...values: any[]): string {
  return strings.reduce((result, str, i) => {
    const value = values[i] ?? '';
    return result + str + escapeHtml(String(value));
  }, '');
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * SkinCell using tagged template literals
 */
export abstract class SkinCellLiteral extends HTMLElement {
  protected shadowRoot!: ShadowRoot;
  protected state: Record<string, any> = {};

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
  }

  /**
   * Template method - returns HTML string using tagged template
   */
  protected abstract template(): string;

  protected render(): void {
    this.shadowRoot.innerHTML = this.template();
    this.attachEventListeners();
  }

  /**
   * Attach event listeners after render
   */
  protected abstract attachEventListeners(): void;

  protected setState(updates: Record<string, any>): void {
    Object.assign(this.state, updates);
    this.render();
  }
}

/**
 * Example: Button using template literals
 */
export class TouchReceptorLiteral extends SkinCellLiteral {
  static get observedAttributes() {
    return ['label', 'variant'];
  }

  constructor() {
    super();
    this.state = { label: 'Button', variant: 'primary' };
  }

  protected template(): string {
    const { label, variant } = this.state;
    return html`
      <style>
        button { padding: 0.5rem 1rem; border: none; cursor: pointer; }
        .primary { background: #0066cc; color: white; }
      </style>
      <button class="${variant}" id="btn">
        ${label}
      </button>
    `;
  }

  protected attachEventListeners(): void {
    const button = this.shadowRoot.getElementById('btn');
    button?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('touch', {
        bubbles: true,
        composed: true
      }));
    });
  }

  attributeChangedCallback(name: string, _old: string, newValue: string): void {
    this.setState({ [name]: newValue });
  }
}

customElements.define('touch-receptor-literal', TouchReceptorLiteral);
```

### Option C: Future - Template Instantiation API (WICG Proposal)

```typescript
/**
 * When Template Instantiation becomes standard (future)
 */

// Define template type
document.defineTemplateType('synapse-template', {
  processCallback(instance, parts, state) {
    for (const part of parts) {
      // Handle mustache syntax {{ }}
      part.value = state[part.expression];
    }
  }
});

// Use in HTML
const template = document.createElement('template');
template.setAttribute('type', 'synapse-template');
template.innerHTML = `
  <div class="user-card">
    <h2>{{name}}</h2>
    <p>{{email}}</p>
  </div>
`;

// Create instance with data binding
const instance = template.createInstance({
  name: 'Alice',
  email: 'alice@example.com'
});

// Update data (re-renders automatically)
instance.update({ name: 'Bob', email: 'bob@example.com' });
```

## 2. Complete Component Examples

### TextReceptor (Input Field)

```typescript
export class TextReceptor extends SkinCell {
  static get observedAttributes() {
    return ['placeholder', 'value', 'type'];
  }

  constructor() {
    super();
    this.state = {
      placeholder: '',
      value: '',
      type: 'text'
    };
  }

  protected defineTemplate(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-family: system-ui;
          font-size: 1rem;
          width: 100%;
          box-sizing: border-box;
        }
        input:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }
      </style>
      <input
        type=""
        placeholder=""
        value=""
        data-bind-attr="type:type,placeholder:placeholder,value:value"
      />
    `;
    return template;
  }

  connectedCallback(): void {
    super.connectedCallback();

    const input = this.shadowRoot.querySelector('input');

    input?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.state.value = target.value;

      // Emit data signal
      this.dispatchEvent(new CustomEvent('data-input', {
        bubbles: true,
        composed: true,
        detail: { value: target.value }
      }));
    });

    input?.addEventListener('focus', () => {
      this.dispatchEvent(new CustomEvent('receptor-focus', {
        bubbles: true,
        composed: true
      }));
    });
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    this.setState({ [name]: newValue });
  }

  // Public API
  get value(): string {
    return this.state.value;
  }

  set value(val: string) {
    this.setState({ value: val });
  }
}

customElements.define('text-receptor', TextReceptor);
```

### DermalLayer (Container/Layout)

```typescript
export class DermalLayer extends SkinCell {
  static get observedAttributes() {
    return ['layout', 'gap'];
  }

  constructor() {
    super();
    this.state = {
      layout: 'vertical',  // or 'horizontal', 'grid'
      gap: '1rem'
    };
  }

  protected defineTemplate(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .container {
          display: flex;
        }
        .vertical { flex-direction: column; }
        .horizontal { flex-direction: row; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
      </style>
      <div class="container" data-bind-attr="class:layout" style="">
        <slot></slot>
      </div>
    `;
    return template;
  }

  protected applyDataBinding(fragment: DocumentFragment): void {
    super.applyDataBinding(fragment);

    // Apply gap styling
    const container = fragment.querySelector('.container') as HTMLElement;
    if (container) {
      container.style.gap = this.state.gap;
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    this.setState({ [name]: newValue });
  }
}

customElements.define('dermal-layer', DermalLayer);
```

## 3. Usage in HTML (Pure Standards)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Synapse Skin Layer Demo</title>
  <script type="module" src="./skin/index.js"></script>
</head>
<body>
  <!-- Pure Web Components - no JSX, no build step -->
  <dermal-layer layout="vertical" gap="1rem">
    <h1>User Login</h1>

    <text-receptor
      id="email"
      type="email"
      placeholder="Enter your email">
    </text-receptor>

    <text-receptor
      id="password"
      type="password"
      placeholder="Enter password">
    </text-receptor>

    <touch-receptor
      id="submit"
      label="Sign In"
      variant="primary">
    </touch-receptor>
  </dermal-layer>

  <script>
    // Standard DOM API usage
    const submitBtn = document.getElementById('submit');
    const emailInput = document.getElementById('email');

    submitBtn.addEventListener('touch', async () => {
      const email = emailInput.value;
      console.log('Submitting:', email);

      // Call backend neuron
      await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    });
  </script>
</body>
</html>
```

## 4. Reactive Data Binding (Standards-Based)

### Using MutationObserver (W3C Standard)

```typescript
export class ReactiveState {
  private data: Record<string, any> = {};
  private observers: Map<string, Set<(value: any) => void>> = new Map();

  set(key: string, value: any): void {
    const oldValue = this.data[key];
    this.data[key] = value;

    if (oldValue !== value) {
      this.notify(key, value);
    }
  }

  get(key: string): any {
    return this.data[key];
  }

  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set());
    }
    this.observers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.observers.get(key)?.delete(callback);
    };
  }

  private notify(key: string, value: any): void {
    this.observers.get(key)?.forEach(callback => callback(value));
  }
}

// Usage in component
export class ReactiveSkinCell extends SkinCell {
  protected reactiveState = new ReactiveState();

  protected bindReactive(element: Element, key: string): void {
    this.reactiveState.subscribe(key, (value) => {
      if (element instanceof HTMLElement) {
        element.textContent = String(value);
      }
    });
  }
}
```

### Using Proxy (ES6 Standard)

```typescript
export class ProxyState<T extends object> {
  private observers: Set<() => void> = new Set();

  constructor(initialState: T) {
    return new Proxy(initialState, {
      set: (target, property, value) => {
        const oldValue = target[property as keyof T];
        target[property as keyof T] = value;

        if (oldValue !== value) {
          this.notify();
        }
        return true;
      }
    }) as any;
  }

  subscribe(callback: () => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notify(): void {
    this.observers.forEach(callback => callback());
  }
}

// Usage
export class ProxySkinCell extends SkinCell {
  constructor() {
    super();
    this.state = new ProxyState({ count: 0 });
    this.state.subscribe(() => this.render());
  }
}
```

## 5. Event System (Standards-Based)

### Neural Signal to DOM Event Mapping

```typescript
/**
 * Convert DOM events to neural signals
 */
export class EventToSignalConverter {
  /**
   * Standard CustomEvent API
   */
  static emitNeuralSignal(
    element: HTMLElement,
    signalType: string,
    data: any,
    strength: number = 1.0
  ): void {
    element.dispatchEvent(new CustomEvent('neural-signal', {
      bubbles: true,
      composed: true,  // Crosses shadow DOM boundaries
      detail: {
        type: signalType,
        data,
        strength,
        timestamp: Date.now(),
        source: element
      }
    }));
  }

  /**
   * Listen for neural signals
   */
  static onNeuralSignal(
    element: HTMLElement,
    callback: (detail: any) => void
  ): () => void {
    const listener = (e: Event) => {
      if (e instanceof CustomEvent) {
        callback(e.detail);
      }
    };

    element.addEventListener('neural-signal', listener);

    // Return cleanup function
    return () => element.removeEventListener('neural-signal', listener);
  }
}

// Usage in component
export class SignalEmittingButton extends SkinCell {
  connectedCallback(): void {
    super.connectedCallback();

    const button = this.shadowRoot.querySelector('button');
    button?.addEventListener('click', () => {
      EventToSignalConverter.emitNeuralSignal(
        this,
        'button:click',
        { label: this.state.label },
        0.9  // High signal strength for direct user interaction
      );
    });
  }
}
```

## 6. Integration with Synapse Neural Network

```typescript
/**
 * Connect Web Component to Synapse neuron
 */
export class NeuralWebComponent extends SkinCell {
  private neuron?: NeuralNode;

  /**
   * Connect to backend neuron
   */
  async connectNeuron(neuronId: string): Promise<void> {
    // Get neuron from Synapse network
    this.neuron = await synapseNetwork.getNeuron(neuronId);

    // Listen for neural signals from component
    EventToSignalConverter.onNeuralSignal(this, async (signal) => {
      // Forward to neuron
      await this.neuron?.receive({
        type: 'ui-event',
        data: signal,
        strength: signal.strength
      });
    });

    // Listen for signals from neuron
    this.neuron?.on('output', (signal) => {
      // Update component state
      this.setState(signal.data);
    });
  }
}
```

## 7. Comparison: Standards vs. Proprietary

| Feature | Standards-Based | JSX/React |
|---------|----------------|-----------|
| **Build step** | ❌ None required | ✅ Required (Babel/TypeScript) |
| **Bundle size** | ✅ ~2KB (components only) | ❌ ~40KB+ (React) |
| **Browser support** | ✅ All modern browsers | ✅ With polyfills |
| **Learning curve** | ✅ Standard DOM APIs | ❌ Framework-specific |
| **Debugging** | ✅ Native browser tools | ❌ React DevTools needed |
| **Framework lock-in** | ✅ None | ❌ Tied to React |
| **Interoperability** | ✅ Works everywhere | ❌ React ecosystem only |
| **SEO** | ✅ Native SSR support | ❌ Requires Next.js |

## 8. Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create base `SkinCell` class using Web Components
- [ ] Implement template system (HTML templates or tagged literals)
- [ ] Add reactive state management with Proxy
- [ ] Create event-to-signal conversion system

### Phase 2: Basic Receptors (Week 2)
- [ ] Implement `TouchReceptor` (button)
- [ ] Implement `TextReceptor` (input)
- [ ] Implement `DataReceptor` (form controls)
- [ ] Add Storybook stories for each

### Phase 3: Containers & Effectors (Week 3)
- [ ] Implement `DermalLayer` (containers)
- [ ] Implement `GlandEffector` (state-changing actions)
- [ ] Implement `MuscleEffector` (animations)
- [ ] Add layout system

### Phase 4: Integration & Testing (Week 4)
- [ ] Connect components to Synapse neurons
- [ ] Add comprehensive tests
- [ ] Performance optimization
- [ ] Documentation and examples

## 9. Recommended Approach

**I recommend Option A: HTML `<template>` + Shadow DOM** because:

1. ✅ **Most standards-compliant** - uses only W3C standards
2. ✅ **Best encapsulation** - Shadow DOM prevents style leaks
3. ✅ **Best performance** - template cloning is highly optimized
4. ✅ **Future-proof** - aligns with Template Instantiation proposal
5. ✅ **Best debugging** - standard DOM tree in DevTools

## 10. Next Steps

1. **Proof of Concept**: Implement `TouchReceptor` using HTML templates
2. **Validation**: Test in all major browsers
3. **Performance**: Benchmark vs. React/Vue
4. **Documentation**: Write usage guide
5. **Migration**: Plan transition from current UI components

Would you like me to start implementing the first proof-of-concept component?
