/**
 * Tests for Effector (Action/Effect components)
 */

import { Effector } from '../Effector';
import type { RenderSignal, EffectorProps, EffectorState } from '../types';
import { NeuralNode } from '../../core/NeuralNode';
import type { Input, Signal } from '../../types';

// Test implementation - Submit button that triggers API calls
class TestSubmitButton extends Effector<
  { label: string; apiEndpoint: string; onSuccess: (data: unknown) => void },
  { submitting: boolean; error: string | null }
> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'button',
          props: {
            disabled: state.submitting,
            className: state.submitting ? 'submitting' : 'idle',
          },
          children: [state.submitting ? 'Submitting...' : props.label],
        },
        styles: {
          opacity: state.submitting ? 0.5 : 1.0,
          cursor: state.submitting ? 'wait' : 'pointer',
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

  protected override async executeProcessing<_TInput = unknown, TOutput = unknown>(
    input: Input<_TInput>,
  ): Promise<TOutput> {
    const signal = input.data as { type?: string; data?: unknown } | undefined;
    if (signal?.type === 'ui:click' && !this.getState().submitting) {
      await this.executeAction({
        id: 'test-signal',
        sourceId: this.id,
        type: 'excitatory',
        strength: 1.0,
        payload: signal.data,
        timestamp: new Date(),
      } as Signal);
    }
    return undefined as TOutput;
  }

  public async performAction(_data: unknown): Promise<unknown> {
    const props = this.getProps();

    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (props.apiEndpoint === '/api/error') {
          reject(new Error('API Error'));
        } else {
          resolve({ success: true, data: 'response' });
        }
      }, 50);
    });
  }
}

// Mock backend neuron
class MockBackendNeuron extends NeuralNode {
  public receivedSignals: unknown[] = [];

  constructor() {
    super({ id: 'mock-backend', type: 'reflex', threshold: 0.5 });
  }

  // Override receive to process signals immediately (like SkinCell)
  public override async receive(signal: unknown): Promise<void> {
    if (this.state !== 'active' && this.state !== 'firing') {
      throw new Error('Node is not active');
    }
    this.receivedSignals.push(signal);
    await this.executeProcessing({ data: signal });
  }

  protected override async executeProcessing<_TInput = unknown, TOutput = unknown>(
    _input: Input<_TInput>,
  ): Promise<TOutput> {
    // Signals are already captured in receive()
    return undefined as TOutput;
  }
}

describe('Effector', () => {
  let effector: TestSubmitButton;
  let onSuccessMock: jest.Mock;

  beforeEach(() => {
    onSuccessMock = jest.fn();
    effector = new TestSubmitButton({
      id: 'submit-button',
      type: 'reflex',
      threshold: 0.5,
      props: {
        label: 'Submit',
        apiEndpoint: '/api/submit',
        onSuccess: onSuccessMock,
      },
      initialState: {
        submitting: false,
        error: null,
      },
    });
  });

  afterEach(async () => {
    await effector.deactivate();
  });

  describe('Action Execution', () => {
    beforeEach(async () => {
      await effector.activate();
    });

    it('should execute action when triggered', async () => {
      const spy = jest.spyOn(effector, 'performAction');

      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalled();
    });

    it('should update state during action execution', async () => {
      const actionPromise = effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      // Check submitting state
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(effector.getState().submitting).toBe(true);

      await actionPromise;
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check completed state
      expect(effector.getState().submitting).toBe(false);
    });

    it('should call onSuccess callback on successful action', async () => {
      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onSuccessMock).toHaveBeenCalledWith({ success: true, data: 'response' });
    });

    it('should handle errors during action execution', async () => {
      effector.updateProps({ apiEndpoint: '/api/error' });

      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(effector.getState().error).toBeTruthy();
      expect(effector.getState().submitting).toBe(false);
    });

    it('should prevent multiple concurrent executions', async () => {
      const spy = jest.spyOn(effector, 'performAction');

      // First click
      effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second click while first is processing
      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should only execute once
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backend Connection', () => {
    let backendNeuron: MockBackendNeuron;

    beforeEach(async () => {
      backendNeuron = new MockBackendNeuron();
      await effector.activate();
      await backendNeuron.activate();
    });

    afterEach(async () => {
      await backendNeuron.deactivate();
    });

    it('should connect to backend neuron', () => {
      effector.connectToBackend(backendNeuron);
      const connections = (effector as unknown as { backendConnections: Map<string, unknown> })
        .backendConnections;
      expect(connections.has(backendNeuron.id)).toBe(true);
    });

    it('should forward signals to backend neuron on action', async () => {
      effector.connectToBackend(backendNeuron);

      await effector.receive({
        type: 'ui:click',
        data: { payload: { data: 'test' }, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(backendNeuron.receivedSignals.length).toBeGreaterThan(0);
    });

    it('should disconnect from backend neuron', () => {
      effector.connectToBackend(backendNeuron);
      effector.disconnectFromBackend(backendNeuron.id);

      const connections = (effector as unknown as { backendConnections: Map<string, unknown> })
        .backendConnections;
      expect(connections.has(backendNeuron.id)).toBe(false);
    });
  });

  describe('Side Effects', () => {
    beforeEach(async () => {
      await effector.activate();
    });

    it('should emit action:start signal when action begins', async () => {
      const signals: unknown[] = [];
      effector.on('signal', (signal) => {
        signals.push(signal);
      });

      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 20));

      const startSignals = signals.filter((s: any) => s.type === 'action:start');
      expect(startSignals.length).toBeGreaterThan(0);
    });

    it('should emit action:complete signal when action succeeds', async () => {
      const signals: unknown[] = [];
      effector.on('signal', (signal) => {
        signals.push(signal);
      });

      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const completeSignals = signals.filter((s: any) => s.type === 'action:complete');
      expect(completeSignals.length).toBeGreaterThan(0);
    });

    it('should emit action:error signal when action fails', async () => {
      effector.updateProps({ apiEndpoint: '/api/error' });

      const signals: unknown[] = [];
      effector.on('signal', (signal) => {
        signals.push(signal);
      });

      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorSignals = signals.filter((s: any) => s.type === 'action:error');
      expect(errorSignals.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering during Actions', () => {
    beforeEach(async () => {
      await effector.activate();
    });

    it('should show loading state during action execution', async () => {
      effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 20));

      const renderSignal = effector.render();
      expect(renderSignal.data.vdom.props!['disabled']).toBe(true);
      expect(renderSignal.data.vdom.children).toContain('Submitting...');
    });

    it('should restore normal state after action completes', async () => {
      await effector.receive({
        type: 'ui:click',
        data: { payload: {}, target: effector.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const renderSignal = effector.render();
      expect(renderSignal.data.vdom.props!['disabled']).toBe(false);
      expect(renderSignal.data.vdom.children).toContain('Submit');
    });
  });

  describe('Action Timeout', () => {
    it('should timeout long-running actions', async () => {
      class SlowMotorNeuron extends TestSubmitButton {
        public override async performAction(_data: unknown): Promise<unknown> {
          return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 5000);
          });
        }
      }

      const slowNeuron = new SlowMotorNeuron({
        id: 'slow-button',
        type: 'reflex',
        threshold: 0.5,
        props: {
          label: 'Slow',
          apiEndpoint: '/api/slow',
          onSuccess: onSuccessMock,
        },
        initialState: { submitting: false, error: null },
      });

      (slowNeuron as unknown as { actionTimeout: number }).actionTimeout = 100; // Set short timeout
      await slowNeuron.activate();

      await slowNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: slowNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(slowNeuron.getState().error).toBeTruthy();
      expect(slowNeuron.getState().submitting).toBe(false);

      await slowNeuron.deactivate();
    });
  });

  describe('Retry Logic', () => {
    it('should support action retry on failure', async () => {
      let attemptCount = 0;

      class RetryMotorNeuron extends TestSubmitButton {
        public override async performAction(_data: unknown): Promise<unknown> {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Retry me');
          }
          return { success: true };
        }
      }

      const retryNeuron = new RetryMotorNeuron({
        id: 'retry-button',
        type: 'reflex',
        threshold: 0.5,
        props: {
          label: 'Retry',
          apiEndpoint: '/api/retry',
          onSuccess: onSuccessMock,
        },
        initialState: { submitting: false, error: null },
      });

      (retryNeuron as unknown as { maxRetries: number }).maxRetries = 3;
      await retryNeuron.activate();

      await retryNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: retryNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      } as unknown as Signal);

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(attemptCount).toBe(3);
      expect(onSuccessMock).toHaveBeenCalled();

      await retryNeuron.deactivate();
    });
  });
});
