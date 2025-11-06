/**
 * Tests for SensoryNeuron (Input components)
 */

import { SensoryNeuron } from '../SensoryNeuron';
import type { RenderSignal, UIEventSignal } from '../types';

// Mock DOM Event
class MockDOMEvent {
  type: string;
  target: any;
  currentTarget: any;
  preventDefault = jest.fn();
  stopPropagation = jest.fn();

  constructor(type: string, target: any = {}) {
    this.type = type;
    this.target = target;
    this.currentTarget = target;
  }
}

// Test implementation
class TestInputNeuron extends SensoryNeuron<
  { placeholder: string; value: string; onChange: (value: string) => void },
  { focused: boolean; value: string }
> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'input',
          props: {
            type: 'text',
            placeholder: props.placeholder,
            value: state.value,
            className: state.focused ? 'focused' : '',
          },
        },
        styles: {
          border: state.focused ? '2px solid blue' : '1px solid gray',
        },
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

  protected async executeProcessing(signal: any): Promise<void> {
    if (signal.type === 'ui:focus') {
      this.setState({ focused: true });
    } else if (signal.type === 'ui:blur') {
      this.setState({ focused: false });
    } else if (signal.type === 'ui:input') {
      const value = signal.data.payload.value;
      this.setState({ value });
      this.getProps().onChange(value);
    }
  }
}

describe('SensoryNeuron', () => {
  let neuron: TestInputNeuron;
  let onChangeMock: jest.Mock;

  beforeEach(() => {
    onChangeMock = jest.fn();
    neuron = new TestInputNeuron({
      id: 'test-input',
      type: 'reflex',
      threshold: 0.3,
      props: {
        placeholder: 'Enter text',
        value: '',
        onChange: onChangeMock,
      },
      initialState: {
        focused: false,
        value: '',
      },
    });
  });

  afterEach(async () => {
    await neuron.deactivate();
  });

  describe('Interaction Capture', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should capture click interactions', async () => {
      const mockEvent = new MockDOMEvent('click', { value: 'test' });
      const signals: any[] = [];

      neuron.on('signal', (signal) => signals.push(signal));

      await neuron.captureInteraction(mockEvent, 'ui:click', {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      const clickSignals = signals.filter((s) => s.type === 'ui:click');
      expect(clickSignals.length).toBeGreaterThan(0);
    });

    it('should capture input events and convert to neural signals', async () => {
      const mockEvent = new MockDOMEvent('input', { value: 'hello' });
      const signals: any[] = [];

      neuron.on('signal', (signal) => signals.push(signal));

      await neuron.captureInteraction(mockEvent, 'ui:input', { value: 'hello' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const inputSignals = signals.filter((s) => s.type === 'ui:input');
      expect(inputSignals.length).toBeGreaterThan(0);
    });

    it('should capture focus events', async () => {
      const mockEvent = new MockDOMEvent('focus', {});
      const signals: any[] = [];

      neuron.on('signal', (signal) => signals.push(signal));

      await neuron.captureInteraction(mockEvent, 'ui:focus', {});

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(neuron.getState().focused).toBe(true);
    });

    it('should capture blur events', async () => {
      await neuron.receive({
        type: 'ui:focus',
        data: { payload: {}, target: neuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const mockEvent = new MockDOMEvent('blur', {});
      await neuron.captureInteraction(mockEvent, 'ui:blur', {});

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(neuron.getState().focused).toBe(false);
    });
  });

  describe('DOM Event to Neural Signal Conversion', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should convert DOM event to neural signal with correct structure', async () => {
      const mockEvent = new MockDOMEvent('input', { value: 'test' });
      let capturedSignal: UIEventSignal | null = null;

      neuron.on('signal', (signal) => {
        if (signal.type === 'ui:input') {
          capturedSignal = signal;
        }
      });

      await neuron.captureInteraction(mockEvent, 'ui:input', { value: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSignal).not.toBeNull();
      expect(capturedSignal!.type).toBe('ui:input');
      expect(capturedSignal!.data.target).toBe(neuron.id);
      expect(capturedSignal!.data.payload).toEqual({ value: 'test' });
    });

    it('should include DOM event reference in signal', async () => {
      const mockEvent = new MockDOMEvent('click', {});
      let capturedSignal: UIEventSignal | null = null;

      neuron.on('signal', (signal) => {
        if (signal.type === 'ui:click') {
          capturedSignal = signal;
        }
      });

      await neuron.captureInteraction(mockEvent, 'ui:click', {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSignal!.data.domEvent).toBe(mockEvent);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should handle input changes', async () => {
      await neuron.receive({
        type: 'ui:input',
        data: { payload: { value: 'hello world' }, target: neuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(neuron.getState().value).toBe('hello world');
      expect(onChangeMock).toHaveBeenCalledWith('hello world');
    });

    it('should handle keyboard events', async () => {
      const mockEvent = new MockDOMEvent('keydown', {});
      const signals: any[] = [];

      neuron.on('signal', (signal) => signals.push(signal));

      await neuron.captureInteraction(mockEvent, 'ui:keydown', { key: 'Enter' });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const keySignals = signals.filter((s) => s.type === 'ui:keydown');
      expect(keySignals.length).toBeGreaterThan(0);
    });
  });

  describe('Signal Strength', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should emit high strength signals for direct user interactions', async () => {
      const mockEvent = new MockDOMEvent('click', {});
      let capturedSignal: UIEventSignal | null = null;

      neuron.on('signal', (signal) => {
        if (signal.type === 'ui:click') {
          capturedSignal = signal;
        }
      });

      await neuron.captureInteraction(mockEvent, 'ui:click', {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSignal!.strength).toBeGreaterThanOrEqual(0.8);
    });

    it('should emit lower strength signals for indirect interactions', async () => {
      const mockEvent = new MockDOMEvent('hover', {});
      let capturedSignal: UIEventSignal | null = null;

      neuron.on('signal', (signal) => {
        if (signal.type === 'ui:hover') {
          capturedSignal = signal;
        }
      });

      await neuron.captureInteraction(mockEvent, 'ui:hover', {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSignal!.strength).toBeLessThan(0.8);
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid input events', async () => {
      class DebouncedInput extends TestInputNeuron {
        protected getRefractoryPeriod(): number {
          return 100;
        }
      }

      const debouncedNeuron = new DebouncedInput({
        id: 'debounced-input',
        type: 'reflex',
        threshold: 0.3,
        props: {
          placeholder: 'Test',
          value: '',
          onChange: onChangeMock,
        },
        initialState: { focused: false, value: '' },
      });

      await debouncedNeuron.activate();

      // Rapid fire events
      for (let i = 0; i < 5; i++) {
        await debouncedNeuron.receive({
          type: 'ui:input',
          data: { payload: { value: `test${i}` }, target: debouncedNeuron.id },
          strength: 1.0,
          timestamp: Date.now(),
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should process fewer than all events due to debouncing
      expect(onChangeMock.mock.calls.length).toBeLessThan(5);

      await debouncedNeuron.deactivate();
    });
  });

  describe('Rendering with Interaction State', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should render different styles when focused', async () => {
      // Unfocused
      let renderSignal = neuron.render();
      expect(renderSignal.data.styles.border).toBe('1px solid gray');

      // Focus
      await neuron.receive({
        type: 'ui:focus',
        data: { payload: {}, target: neuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      renderSignal = neuron.render();
      expect(renderSignal.data.styles.border).toBe('2px solid blue');
    });

    it('should update rendered value when input changes', async () => {
      await neuron.receive({
        type: 'ui:input',
        data: { payload: { value: 'new value' }, target: neuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const renderSignal = neuron.render();
      expect(renderSignal.data.vdom.props!.value).toBe('new value');
    });
  });

  describe('Event Bubbling', () => {
    beforeEach(async () => {
      await neuron.activate();
    });

    it('should support event bubbling by default', async () => {
      const mockEvent = new MockDOMEvent('click', {});
      let capturedSignal: UIEventSignal | null = null;

      neuron.on('signal', (signal) => {
        if (signal.type === 'ui:click') {
          capturedSignal = signal;
        }
      });

      await neuron.captureInteraction(mockEvent, 'ui:click', {}, true);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSignal!.data.bubbles).toBe(true);
    });

    it('should allow stopping event propagation', async () => {
      const mockEvent = new MockDOMEvent('click', {});
      let capturedSignal: UIEventSignal | null = null;

      neuron.on('signal', (signal) => {
        if (signal.type === 'ui:click') {
          capturedSignal = signal;
        }
      });

      await neuron.captureInteraction(mockEvent, 'ui:click', {}, false);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSignal!.data.bubbles).toBe(false);
    });
  });
});
