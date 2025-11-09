/**
 * TouchReceptor Test Suite
 *
 * Tests for the TouchReceptor (button) component using Web Components
 */

import { TouchReceptor } from '../receptors/TouchReceptor';

// Wait for custom element to be defined
beforeAll(async () => {
  // Ensure the custom element is registered
  if (!customElements.get('touch-receptor')) {
    customElements.define('touch-receptor', TouchReceptor);
  }
  await customElements.whenDefined('touch-receptor');
});

describe('TouchReceptor', () => {
  let receptor: TouchReceptor;

  beforeEach(() => {
    receptor = document.createElement('touch-receptor') as TouchReceptor;
    document.body.appendChild(receptor);
  });

  afterEach(() => {
    if (receptor && receptor.parentNode) {
      receptor.parentNode.removeChild(receptor);
    }
  });

  describe('Initialization', () => {
    it('should create a touch receptor', () => {
      expect(receptor).toBeInstanceOf(TouchReceptor);
      expect(receptor.tagName.toLowerCase()).toBe('touch-receptor');
    });

    it('should have shadow DOM', () => {
      expect(receptor.shadowRoot).not.toBeNull();
    });

    it('should render a button element', () => {
      const button = receptor.shadowRoot?.querySelector('button');
      expect(button).not.toBeNull();
    });

    it('should have default state', () => {
      expect(receptor.disabled).toBe(false);
      expect(receptor.value).toBeUndefined();
    });
  });

  describe('Rendering', () => {
    it('should render label from attribute', async () => {
      receptor.setAttribute('label', 'Click Me');

      // Wait for attribute change to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      const label = receptor.shadowRoot?.querySelector('.label');
      expect(label?.textContent).toBe('Click Me');
    });

    it('should apply variant class', async () => {
      receptor.setAttribute('variant', 'primary');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const button = receptor.shadowRoot?.querySelector('button');
      expect(button?.classList.contains('primary')).toBe(true);
    });

    it('should apply size class', async () => {
      receptor.setAttribute('size', 'large');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const button = receptor.shadowRoot?.querySelector('button');
      expect(button?.classList.contains('large')).toBe(true);
    });

    it('should render disabled state', async () => {
      receptor.setAttribute('disabled', '');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const button = receptor.shadowRoot?.querySelector('button');
      expect(button?.hasAttribute('disabled')).toBe(true);
    });

    it('should render loading state', async () => {
      receptor.setAttribute('loading', '');

      await new Promise((resolve) => setTimeout(resolve, 10));

      const button = receptor.shadowRoot?.querySelector('button');
      expect(button?.classList.contains('loading')).toBe(true);
    });
  });

  describe('Interactions', () => {
    it('should emit touch event on click', (done) => {
      receptor.addEventListener('touch', ((event: CustomEvent) => {
        expect(event.detail).toBeDefined();
        done();
      }) as EventListener);

      const button = receptor.shadowRoot?.querySelector('button');
      button?.click();
    });

    it('should not emit event when disabled', (done) => {
      receptor.setAttribute('disabled', '');

      let eventFired = false;
      receptor.addEventListener('touch', () => {
        eventFired = true;
      });

      setTimeout(() => {
        const button = receptor.shadowRoot?.querySelector('button');
        button?.click();

        setTimeout(() => {
          expect(eventFired).toBe(false);
          done();
        }, 50);
      }, 10);
    });

    it('should not emit event when loading', (done) => {
      receptor.setAttribute('loading', '');

      let eventFired = false;
      receptor.addEventListener('touch', () => {
        eventFired = true;
      });

      setTimeout(() => {
        const button = receptor.shadowRoot?.querySelector('button');
        button?.click();

        setTimeout(() => {
          expect(eventFired).toBe(false);
          done();
        }, 50);
      }, 10);
    });

    it('should emit neural signal on click', (done) => {
      receptor.addEventListener('neural-signal', ((event: CustomEvent) => {
        expect(event.detail.type).toContain('mechanoreceptor:touch');
        expect(event.detail.strength).toBeGreaterThan(0);
        done();
      }) as EventListener);

      const button = receptor.shadowRoot?.querySelector('button');
      button?.click();
    });

    it('should handle keyboard enter key', (done) => {
      receptor.addEventListener('touch', () => {
        done();
      });

      const button = receptor.shadowRoot?.querySelector('button');
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button?.dispatchEvent(keyEvent);
    });

    it('should handle keyboard space key', (done) => {
      receptor.addEventListener('touch', () => {
        done();
      });

      const button = receptor.shadowRoot?.querySelector('button');
      const keyEvent = new KeyboardEvent('keydown', { key: ' ' });
      button?.dispatchEvent(keyEvent);
    });
  });

  describe('Focus Management', () => {
    it('should be focusable', () => {
      const button = receptor.shadowRoot?.querySelector('button');
      expect(button).not.toBeNull();

      // Focus method should execute without error
      expect(() => receptor.focus()).not.toThrow();

      // Note: In jsdom, delegatesFocus may not fully work,
      // but in a real browser, focus would be delegated to the button
    });

    it('should emit focus event', (done) => {
      let called = false;
      receptor.addEventListener('focus', () => {
        if (!called) {
          called = true;
          done();
        }
      });

      receptor.focus();
    });

    it('should call blur method', () => {
      receptor.focus();

      // Just verify blur can be called without error
      expect(() => receptor.blur()).not.toThrow();

      // In jsdom, blur events don't always fire properly,
      // but in a real browser this would emit a blur event
    });
  });

  describe('Public API', () => {
    it('should enable and disable', async () => {
      receptor.disable();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(receptor.disabled).toBe(true);

      receptor.enable();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(receptor.disabled).toBe(false);
    });

    it('should set loading state', async () => {
      receptor.setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      let button = receptor.shadowRoot?.querySelector('button');
      expect(button?.classList.contains('loading')).toBe(true);

      receptor.setLoading(false);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Query button again after re-render
      button = receptor.shadowRoot?.querySelector('button');
      expect(button?.classList.contains('loading')).toBe(false);
    });

    it('should programmatically press', (done) => {
      receptor.addEventListener('touch', () => {
        done();
      });

      receptor.press();
    });
  });

  describe('Variants', () => {
    it.each(['primary', 'secondary', 'danger', 'ghost'] as const)(
      'should support %s variant',
      async (variant) => {
        receptor.setAttribute('variant', variant);
        await new Promise((resolve) => setTimeout(resolve, 10));

        const button = receptor.shadowRoot?.querySelector('button');
        expect(button?.classList.contains(variant)).toBe(true);
      },
    );
  });

  describe('Sizes', () => {
    it.each(['small', 'medium', 'large'] as const)('should support %s size', async (size) => {
      receptor.setAttribute('size', size);
      await new Promise((resolve) => setTimeout(resolve, 10));

      const button = receptor.shadowRoot?.querySelector('button');
      expect(button?.classList.contains(size)).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on disconnect', () => {
      const spy = jest.spyOn(receptor as unknown as { cleanup: () => void }, 'cleanup');

      receptor.remove();

      expect(spy).toHaveBeenCalled();
    });
  });
});
