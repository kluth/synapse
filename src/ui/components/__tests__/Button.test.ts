/**
 * Tests for Button component
 */

import { Button } from '../Button';

describe('Button Component', () => {
  let button: Button;

  beforeEach(() => {
    button = new Button({
      id: 'test-button',
      type: 'reflex',
      threshold: 0.5,
      props: {
        label: 'Click Me',
        variant: 'primary',
        onClick: jest.fn(),
      },
      initialState: {
        pressed: false,
        hovered: false,
        disabled: false,
      },
    });
  });

  afterEach(async () => {
    await button.deactivate();
  });

  describe('Rendering', () => {
    it('should render button with label', () => {
      const rendered = button.render();
      expect(rendered.data.vdom.tag).toBe('button');
      expect(rendered.data.vdom.children).toContain('Click Me');
    });

    it('should apply variant class', () => {
      const rendered = button.render();
      expect(rendered.data.vdom.props?.['className']).toContain('primary');
    });

    it('should render as disabled', () => {
      button.updateProps({ disabled: true });
      const rendered = button.render();
      expect(rendered.data.vdom.props?.['disabled']).toBe(true);
    });
  });

  describe('Interactions', () => {
    beforeEach(async () => {
      await button.activate();
    });

    it('should handle click events', async () => {
      const onClick = jest.fn();
      button.updateProps({ onClick });

      await button.receive({
        id: crypto.randomUUID(),
        sourceId: 'test',
        type: 'excitatory',
        strength: 1.0,
        payload: { type: 'ui:click', data: { target: button.id } },
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onClick).toHaveBeenCalled();
    });

    it('should show pressed state on click', async () => {
      await button.receive({
        id: crypto.randomUUID(),
        sourceId: 'test',
        type: 'excitatory',
        strength: 1.0,
        payload: { type: 'ui:mousedown' },
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.getState().pressed).toBe(true);
    });

    it('should not trigger onClick when disabled', async () => {
      const onClick = jest.fn();
      button.updateProps({ disabled: true, onClick });

      await button.receive({
        id: crypto.randomUUID(),
        sourceId: 'test',
        type: 'excitatory',
        strength: 1.0,
        payload: { type: 'ui:click' },
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('should support primary variant', () => {
      button.updateProps({ variant: 'primary' });
      const rendered = button.render();
      expect(rendered.data.styles['backgroundColor']).toBeDefined();
    });

    it('should support secondary variant', () => {
      button.updateProps({ variant: 'secondary' });
      const rendered = button.render();
      expect(rendered.data.vdom.props?.['className']).toContain('secondary');
    });

    it('should support danger variant', () => {
      button.updateProps({ variant: 'danger' });
      const rendered = button.render();
      expect(rendered.data.vdom.props?.['className']).toContain('danger');
    });
  });

  describe('Sizes', () => {
    it('should support small size', () => {
      button.updateProps({ size: 'small' });
      const rendered = button.render();
      expect(rendered.data.vdom.props?.['className']).toContain('small');
    });

    it('should support large size', () => {
      button.updateProps({ size: 'large' });
      const rendered = button.render();
      expect(rendered.data.vdom.props?.['className']).toContain('large');
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      button.updateProps({ loading: true });
      const rendered = button.render();
      expect(rendered.data.vdom.props?.['disabled']).toBe(true);
      expect(rendered.data.vdom.props?.['className']).toContain('loading');
    });
  });
});
