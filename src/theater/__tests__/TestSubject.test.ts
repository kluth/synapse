/**
 * TestSubject Tests
 */

import { TestSubject } from '../laboratory/TestSubject';
import { VisualNeuron } from '../../ui/VisualNeuron';

// Test component
class TestComponent extends VisualNeuron<{ label: string; count: number }> {
  constructor() {
    super({
      id: 'test-component',
      type: 'cortical',
      threshold: 0.5,
      props: { label: 'Test', count: 0 },
      initialState: { clicks: 0 },
    });
  }

  protected executeProcessing(): Promise<void> {
    return Promise.resolve();
  }

  protected performRender() {
    const label = this.receptiveField.label ?? 'Test';
    const count = this.receptiveField.count ?? 0;

    return {
      type: 'render' as const,
      data: {
        vdom: {
          tag: 'div',
          props: { className: 'test-component' },
          children: [
            { tag: 'span', children: [label] },
            { tag: 'span', children: [String(count)] },
          ],
        },
        styles: {},
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}

describe('TestSubject - Component Testing Wrapper', () => {
  describe('Construction and Mounting', () => {
    it('should create a test subject', () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component });

      expect(subject).toBeDefined();
      expect(subject.getComponent()).toBe(component);
    });

    it('should auto-mount when configured', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      // Wait a bit for auto-mount to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(subject.isMounted()).toBe(true);
      expect(subject.isActive()).toBe(true);
    });

    it('should not auto-mount by default', () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component });

      expect(subject.isMounted()).toBe(false);
    });

    it('should mount manually', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component });

      await subject.mount();

      expect(subject.isMounted()).toBe(true);
      expect(subject.isActive()).toBe(true);
    });

    it('should unmount', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.unmount();

      expect(subject.isMounted()).toBe(false);
      expect(subject.isActive()).toBe(false);
    });

    it('should set initial props', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({
        component,
        initialProps: { label: 'Custom', count: 42 },
      });

      await subject.mount();

      const props = subject.getProps();
      expect(props.label).toBe('Custom');
      expect(props.count).toBe(42);
    });
  });

  describe('Props and State Management', () => {
    it('should get component props', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const props = subject.getProps();
      expect(props.label).toBe('Test');
      expect(props.count).toBe(0);
    });

    it('should update component props', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      subject.setProps({ label: 'Updated' });

      const props = subject.getProps();
      expect(props.label).toBe('Updated');
    });

    it('should get component state', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const state = subject.getState();
      expect(state.clicks).toBe(0);
    });

    it('should update component state', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      subject.setState({ clicks: 5 });

      const state = subject.getState();
      expect(state.clicks).toBe(5);
    });
  });

  describe('Rendering', () => {
    it('should render component', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const output = subject.render();
      expect(output).toContain('test-component');
      expect(output).toContain('Test');
    });

    it('should track render count', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const initialCount = subject.getRenderCount();
      subject.render();
      subject.render();

      expect(subject.getRenderCount()).toBe(initialCount + 2);
    });

    it('should get last render output', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      subject.render();

      const output = subject.getRenderOutput();
      expect(output).toContain('test-component');
    });

    it('should re-render when props change', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const beforeCount = subject.getRenderCount();
      subject.setProps({ label: 'Changed' });

      expect(subject.getRenderCount()).toBeGreaterThan(beforeCount);
      expect(subject.getRenderOutput()).toContain('Changed');
    });
  });

  describe('Interactions', () => {
    it('should simulate click interaction', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.interact({ type: 'click' });

      const interactions = subject.getInteractions();
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('click');
    });

    it('should simulate input interaction', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.interact({ type: 'input', data: 'test value' });

      const interactions = subject.getInteractions();
      expect(interactions[0].type).toBe('input');
      expect(interactions[0].data).toBe('test value');
    });

    it('should simulate focus interaction', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.interact({ type: 'focus' });

      const interactions = subject.getInteractions();
      expect(interactions[0].type).toBe('focus');
    });

    it('should simulate blur interaction', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.interact({ type: 'blur' });

      const interactions = subject.getInteractions();
      expect(interactions[0].type).toBe('blur');
    });

    it('should simulate keyboard interaction', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.interact({ type: 'keydown', data: 'Enter' });

      const interactions = subject.getInteractions();
      expect(interactions[0].type).toBe('keydown');
      expect(interactions[0].data).toBe('Enter');
    });

    it('should support interaction delay', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const startTime = Date.now();
      await subject.interact({ type: 'click', delay: 50 });
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(50);
    });

    it('should track interaction history', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await subject.interact({ type: 'focus' });
      await subject.interact({ type: 'input', data: 'test' });
      await subject.interact({ type: 'blur' });

      const interactions = subject.getInteractions();
      expect(interactions).toHaveLength(3);
    });

    it('should clear interaction history', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.interact({ type: 'click' });

      subject.clearInteractions();

      expect(subject.getInteractions()).toHaveLength(0);
    });
  });

  describe('Element Queries', () => {
    it('should find element in render output', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      subject.render();

      expect(subject.find('test-component')).toBe(true);
      expect(subject.find('nonexistent')).toBe(false);
    });

    it('should find all matching elements', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      subject.render();

      const spans = subject.findAll('span');
      expect(spans.length).toBeGreaterThan(0);
    });

    it('should get text content', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      subject.render();

      const text = subject.getText();
      expect(text).toContain('Test');
      expect(text).not.toContain('<');
    });
  });

  describe('Async Helpers', () => {
    it('should wait for render', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      setTimeout(() => {
        subject.render();
      }, 50);

      const output = await subject.waitForRender();
      expect(output).toBeDefined();
    });

    it('should timeout waiting for render', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await expect(subject.waitForRender(50)).rejects.toThrow('Timeout waiting for render');
    });

    it('should wait for condition', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      setTimeout(() => {
        void subject.setState({ clicks: 10 });
      }, 50);

      await subject.waitFor(() => subject.getState().clicks === 10, { timeout: 200 });

      expect(subject.getState().clicks).toBe(10);
    });

    it('should timeout waiting for condition', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await expect(subject.waitFor(() => false, { timeout: 50 })).rejects.toThrow(
        'Timeout waiting for condition',
      );
    });
  });

  describe('Snapshot', () => {
    it('should take snapshot of current state', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      subject.setState({ clicks: 5 });
      subject.setProps({ count: 10 });

      const snapshot = subject.snapshot();

      expect(snapshot.props.count).toBe(10);
      expect(snapshot.state.clicks).toBe(5);
      expect(snapshot.mounted).toBe(true);
      expect(snapshot.active).toBe(true);
      expect(snapshot.renderOutput).toBeDefined();
    });
  });

  describe('Reset and Cleanup', () => {
    it('should reset test subject', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.interact({ type: 'click' });
      subject.render();

      await subject.reset();

      expect(subject.isMounted()).toBe(false);
      expect(subject.getRenderCount()).toBe(0);
      expect(subject.getRenderOutput()).toBe('');
      expect(subject.getInteractions()).toHaveLength(0);
    });

    it('should cleanup test subject', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));
      await subject.cleanup();

      expect(subject.isMounted()).toBe(false);
    });
  });
});
