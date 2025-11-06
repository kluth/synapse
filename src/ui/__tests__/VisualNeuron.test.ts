/**
 * Tests for VisualNeuron base class
 */

import { VisualNeuron } from '../VisualNeuron';
import type { RenderSignal, UIEventSignal } from '../types';
import { ComponentProps, ComponentState } from '../types';

// Test implementation of VisualNeuron
class TestVisualNeuron extends VisualNeuron<{ label: string; value: number }, { count: number }> {
  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: any,
  ): Promise<TOutput> {
    const signal = input.data;
    if (signal?.type === 'ui:click' || signal?.payload?.type === 'ui:click') {
      this.setState({ count: this.getState().count + 1 });
    }
    return undefined as TOutput;
  }

  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: { className: 'test' },
          children: [`${props.label}: ${state.count}`],
        },
        styles: { color: 'blue' },
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now(),
        },
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}

describe('VisualNeuron', () => {
  let neuron: TestVisualNeuron;

  beforeEach(() => {
    neuron = new TestVisualNeuron({
      id: 'test-visual',
      type: 'cortical',
      threshold: 0.5,
      props: { label: 'Counter', value: 0 },
      initialState: { count: 0 },
    });
  });

  afterEach(async () => {
    await neuron.deactivate();
  });

  describe('Construction and Initialization', () => {
    it('should create a visual neuron with props and state', () => {
      expect(neuron.id).toBe('test-visual');
      expect(neuron.getProps()).toEqual({ label: 'Counter', value: 0 });
      expect(neuron.getState()).toEqual({ count: 0 });
    });

    it('should initialize render count to 0', () => {
      expect(neuron.getRenderCount()).toBe(0);
    });

    it('should start in inactive state', () => {
      expect(neuron.getStatus()).toBe('inactive');
    });
  });

  describe('Props Management', () => {
    it('should update props', () => {
      neuron.updateProps({ label: 'New Label', value: 10 });
      expect(neuron.getProps()).toEqual({ label: 'New Label', value: 10 });
    });

    it('should partially update props', () => {
      neuron.updateProps({ value: 5 });
      expect(neuron.getProps()).toEqual({ label: 'Counter', value: 5 });
    });

    it('should trigger shouldUpdate when props change', () => {
      const spy = jest.spyOn(neuron as any, 'shouldUpdate');
      neuron.updateProps({ value: 5 });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should update state', () => {
      neuron.setState({ count: 5 });
      expect(neuron.getState()).toEqual({ count: 5 });
    });

    it('should partially update state', () => {
      neuron.setState({ count: 10 });
      expect(neuron.getState().count).toBe(10);
    });

    it('should emit state:update signal when state changes', async () => {
      const signals: any[] = [];
      neuron.on('signal', (signal) => signals.push(signal));

      neuron.setState({ count: 3 });

      // Wait for async emission
      await new Promise((resolve) => setTimeout(resolve, 10));

      const stateSignals = signals.filter((s) => s.type === 'state:update');
      expect(stateSignals.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should render virtual DOM', () => {
      const renderSignal = neuron.render();

      expect(renderSignal.type).toBe('render');
      expect(renderSignal.data.vdom.tag).toBe('div');
      expect(renderSignal.data.vdom.children).toContain('Counter: 0');
    });

    it('should include styles in render output', () => {
      const renderSignal = neuron.render();
      expect(renderSignal.data.styles).toEqual({ color: 'blue' });
    });

    it('should include metadata in render output', () => {
      const renderSignal = neuron.render();
      expect(renderSignal.data.metadata).toMatchObject({
        componentId: 'test-visual',
        renderCount: expect.any(Number),
        lastRenderTime: expect.any(Number),
      });
    });

    it('should increment render count on each render', () => {
      const initialCount = neuron.getRenderCount();
      neuron.render();
      expect(neuron.getRenderCount()).toBe(initialCount + 1);
    });

    it('should update render output when state changes', () => {
      neuron.setState({ count: 5 });
      const renderSignal = neuron.render();
      expect(renderSignal.data.vdom.children).toContain('Counter: 5');
    });
  });

  describe('shouldUpdate', () => {
    it('should return true by default when props change', () => {
      const result = (neuron as any).shouldUpdate({ label: 'New', value: 1 });
      expect(result).toBe(true);
    });

    it('should return false if props are identical', () => {
      const currentProps = neuron.getProps();
      const result = (neuron as any).shouldUpdate(currentProps);
      expect(result).toBe(false);
    });
  });

  describe('Event Emission', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should emit UI events', async () => {
      const events: UIEventSignal[] = [];
      neuron.on('signal', (signal) => {
        if (signal.type.startsWith('ui:')) {
          events.push(signal as UIEventSignal);
        }
      });

      neuron.emitUIEvent<{ test: string }>({
        type: 'ui:click',
        data: {
          payload: { test: 'data' },
          target: neuron.id,
        },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('ui:click');
      expect(events[0].data.payload).toEqual({ test: 'data' });
    });
  });

  describe('Lifecycle', () => {
    it('should activate successfully', async () => {
      await neuron.activate();
      expect(neuron.getStatus()).toBe('active');
    });

    it('should deactivate successfully', async () => {
      await neuron.activate();
      await neuron.deactivate();
      expect(neuron.getStatus()).toBe('inactive');
    });

    it('should call onMount hook when activated', async () => {
      const spy = jest.spyOn(neuron as any, 'onMount');
      await neuron.activate();
      expect(spy).toHaveBeenCalled();
    });

    it('should call onUnmount hook when deactivated', async () => {
      await neuron.activate();
      const spy = jest.spyOn(neuron as any, 'onUnmount');
      await neuron.deactivate();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Signal Processing', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should process UI signals', async () => {
      const initialCount = neuron.getState().count;

      await neuron.receive({
        type: 'ui:click',
        data: {},
        strength: 1.0,
        timestamp: Date.now(),
      });

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(neuron.getState().count).toBe(initialCount + 1);
    });

    it('should respect activation threshold', async () => {
      const highThresholdNeuron = new TestVisualNeuron({
        id: 'high-threshold',
        type: 'cortical',
        threshold: 0.9,
        props: { label: 'Test', value: 0 },
        initialState: { count: 0 },
      });

      await highThresholdNeuron.activate();

      // Low strength signal should not trigger processing
      await highThresholdNeuron.receive({
        type: 'ui:click',
        data: {},
        strength: 0.5,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(highThresholdNeuron.getState().count).toBe(0);

      await highThresholdNeuron.deactivate();
    });
  });

  describe('Refractory Period', () => {
    it('should have default refractory period', () => {
      expect((neuron as any).getRefractoryPeriod()).toBeGreaterThanOrEqual(0);
    });

    it('should prevent rapid sequential processing during refractory period', async () => {
      class RefractoryNeuron extends TestVisualNeuron {
        protected getRefractoryPeriod(): number {
          return 100; // 100ms refractory period
        }
      }

      const refractoryNeuron = new RefractoryNeuron({
        id: 'refractory-test',
        type: 'cortical',
        threshold: 0.5,
        props: { label: 'Test', value: 0 },
        initialState: { count: 0 },
      });

      await refractoryNeuron.activate();

      // First signal
      await refractoryNeuron.receive({
        type: 'ui:click',
        data: {},
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Second signal during refractory period
      await refractoryNeuron.receive({
        type: 'ui:click',
        data: {},
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should only process first signal
      expect(refractoryNeuron.getState().count).toBeLessThanOrEqual(1);

      await refractoryNeuron.deactivate();
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should track render count', () => {
      expect(neuron.getRenderCount()).toBe(0);
      neuron.render();
      expect(neuron.getRenderCount()).toBe(1);
      neuron.render();
      expect(neuron.getRenderCount()).toBe(2);
    });

    it('should track last render time', () => {
      const before = Date.now();
      neuron.render();
      const after = Date.now();
      const lastRender = neuron.getLastRenderTime();
      expect(lastRender).toBeGreaterThanOrEqual(before);
      expect(lastRender).toBeLessThanOrEqual(after);
    });
  });
});
