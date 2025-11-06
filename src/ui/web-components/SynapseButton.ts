/**
 * Web Component wrapper for Synapse Button
 * Framework-agnostic custom element
 */

import { Button } from '../components/Button';

export class SynapseButton extends HTMLElement {
  private button: Button | null = null;
  private shadowRoot: ShadowRoot;

  static get observedAttributes(): string[] {
    return ['label', 'variant', 'size', 'disabled', 'loading'];
  }

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    if (this.button) {
      this.button.deactivate();
    }
  }

  attributeChangedCallback(): void {
    if (this.button) {
      this.render();
    }
  }

  private async render(): Promise<void> {
    const label = this.getAttribute('label') || 'Button';
    const variant = (this.getAttribute('variant') || 'primary') as any;
    const size = (this.getAttribute('size') || 'medium') as any;
    const disabled = this.hasAttribute('disabled');
    const loading = this.hasAttribute('loading');

    // Clean up old button
    if (this.button) {
      await this.button.deactivate();
    }

    // Create new button neuron
    this.button = new Button({
      id: `button-${Math.random()}`,
      type: 'reflex',
      threshold: 0.5,
      props: {
        label,
        variant,
        size,
        disabled,
        loading,
        onClick: () => {
          this.dispatchEvent(
            new CustomEvent('synapse-click', {
              bubbles: true,
              composed: true,
              detail: { label },
            }),
          );
        },
      },
      initialState: {
        pressed: false,
        hovered: false,
        disabled,
      },
    });

    await this.button.activate();

    // Render to shadow DOM
    const renderSignal = this.button.render();
    this.renderToShadowDOM(renderSignal.data.vdom, renderSignal.data.styles);
  }

  private renderToShadowDOM(vdom: any, styles: any): void {
    this.shadowRoot.innerHTML = '';

    // Create style element
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :host {
        display: inline-block;
      }
      button {
        font-family: system-ui, -apple-system, sans-serif;
        cursor: pointer;
        transition: all 0.2s;
      }
      button:hover:not(:disabled) {
        filter: brightness(1.1);
      }
      button:active:not(:disabled) {
        transform: scale(0.98);
      }
    `;
    this.shadowRoot.appendChild(styleEl);

    // Create button element
    const button = document.createElement(vdom.tag);

    // Apply props
    if (vdom.props) {
      Object.entries(vdom.props).forEach(([key, value]) => {
        if (key === 'className') {
          button.className = value as string;
        } else if (key.startsWith('aria-')) {
          button.setAttribute(key, String(value));
        } else {
          (button as any)[key] = value;
        }
      });
    }

    // Apply styles
    if (styles) {
      Object.entries(styles).forEach(([key, value]) => {
        (button.style as any)[key] = value;
      });
    }

    // Add children
    if (vdom.children) {
      vdom.children.forEach((child: any) => {
        if (typeof child === 'string') {
          button.appendChild(document.createTextNode(child));
        }
      });
    }

    // Add click handler
    button.addEventListener('click', async () => {
      if (this.button) {
        await this.button.receive({
          id: crypto.randomUUID(),
          sourceId: 'user',
          type: 'excitatory',
          strength: 1.0,
          payload: { type: 'ui:click' },
          timestamp: new Date(),
        });
      }
    });

    this.shadowRoot.appendChild(button);
  }
}

// Register the custom element
if (!customElements.get('synapse-button')) {
  customElements.define('synapse-button', SynapseButton);
}
