/**
 * Web Component wrapper for Synapse Input
 */

import { Input } from '../components/Input';

export class SynapseInput extends HTMLElement {
  private input: Input | null = null;
  private shadowRoot: ShadowRoot;

  static get observedAttributes(): string[] {
    return ['type', 'placeholder', 'value', 'disabled', 'label', 'error'];
  }

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    if (this.input) {
      this.input.deactivate();
    }
  }

  attributeChangedCallback(): void {
    if (this.input) {
      this.render();
    }
  }

  private async render(): Promise<void> {
    const type = (this.getAttribute('type') || 'text') as any;
    const placeholder = this.getAttribute('placeholder') || '';
    const value = this.getAttribute('value') || '';
    const disabled = this.hasAttribute('disabled');
    const label = this.getAttribute('label') || '';
    const error = this.getAttribute('error') || '';

    if (this.input) {
      await this.input.deactivate();
    }

    this.input = new Input({
      id: `input-${Math.random()}`,
      type: 'reflex',
      threshold: 0.3,
      props: {
        type,
        placeholder,
        value,
        disabled,
        label,
        error,
        onChange: (newValue: string) => {
          this.setAttribute('value', newValue);
          this.dispatchEvent(
            new CustomEvent('synapse-change', {
              bubbles: true,
              composed: true,
              detail: { value: newValue },
            }),
          );
        },
      },
      initialState: {
        focused: false,
        value,
        hasError: !!error,
      },
    });

    await this.input.activate();

    const renderSignal = this.input.render();
    this.renderToShadowDOM(renderSignal.data.vdom, renderSignal.data.styles);
  }

  private renderToShadowDOM(vdom: any, styles: any): void {
    this.shadowRoot.innerHTML = '';

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :host {
        display: block;
      }
      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      label {
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }
      input {
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        font-family: system-ui;
        transition: all 0.2s;
      }
      input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      input.error {
        border-color: #dc3545;
      }
      .error-message {
        font-size: 12px;
        color: #dc3545;
      }
    `;
    this.shadowRoot.appendChild(styleEl);

    this.renderVNode(vdom, this.shadowRoot);
  }

  private renderVNode(vnode: any, parent: Node): void {
    if (typeof vnode === 'string') {
      if (vnode.trim()) {
        parent.appendChild(document.createTextNode(vnode));
      }
      return;
    }

    const el = document.createElement(vnode.tag);

    if (vnode.props) {
      Object.entries(vnode.props).forEach(([key, value]) => {
        if (key === 'className') {
          el.className = value as string;
        } else if (key.startsWith('aria-')) {
          el.setAttribute(key, String(value));
        } else if (key === 'value' && vnode.tag === 'input') {
          (el as HTMLInputElement).value = String(value);
        } else {
          (el as any)[key] = value;
        }
      });
    }

    if (vnode.tag === 'input') {
      el.addEventListener('input', async (e) => {
        const value = (e.target as HTMLInputElement).value;
        if (this.input) {
          await this.input.receive({
            id: crypto.randomUUID(),
            sourceId: 'user',
            type: 'excitatory',
            strength: 0.9,
            payload: {
              type: 'ui:input',
              data: { payload: { value } },
            },
            timestamp: new Date(),
          });
        }
      });

      el.addEventListener('focus', async () => {
        if (this.input) {
          await this.input.receive({
            id: crypto.randomUUID(),
            sourceId: 'user',
            type: 'excitatory',
            strength: 0.8,
            payload: { type: 'ui:focus' },
            timestamp: new Date(),
          });
        }
      });

      el.addEventListener('blur', async () => {
        if (this.input) {
          await this.input.receive({
            id: crypto.randomUUID(),
            sourceId: 'user',
            type: 'excitatory',
            strength: 0.8,
            payload: { type: 'ui:blur' },
            timestamp: new Date(),
          });
        }
      });
    }

    if (vnode.children) {
      vnode.children.forEach((child: any) => {
        this.renderVNode(child, el);
      });
    }

    parent.appendChild(el);
  }
}

if (!customElements.get('synapse-input')) {
  customElements.define('synapse-input', SynapseInput);
}
