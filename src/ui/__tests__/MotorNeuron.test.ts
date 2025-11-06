/**
 * Tests for MotorNeuron (Action/Effect components)
 */

import { MotorNeuron } from '../MotorNeuron';
import type { RenderSignal } from '../types';
import { NeuralNode } from '../../core/NeuralNode';

// Test implementation - Submit button that triggers API calls
class TestSubmitButton extends MotorNeuron<
  { label: string; apiEndpoint: string; onSuccess: (data: any) => void },
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

  protected async executeProcessing(signal: any): Promise<void> {
    if (signal.type === 'ui:click' && !this.getState().submitting) {
      await this.executeAction(signal);
    }
  }

  public async performAction(data: any): Promise<any> {
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
  public receivedSignals: any[] = [];

  constructor() {
    super({ id: 'mock-backend', type: 'reflex', threshold: 0.5 });
  }

  // Override receive to process signals immediately (like VisualNeuron)
  public async receive(signal: any): Promise<void> {
    if (this.state !== 'active' && this.state !== 'firing') {
      throw new Error('Node is not active');
    }
    this.receivedSignals.push(signal);
    await this.executeProcessing(signal);
  }

  protected async executeProcessing(signal: any): Promise<void> {
    // Signals are already captured in receive()
  }
}

describe('MotorNeuron', () => {
  let motorNeuron: TestSubmitButton;
  let onSuccessMock: jest.Mock;

  beforeEach(() => {
    onSuccessMock = jest.fn();
    motorNeuron = new TestSubmitButton({
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
    await motorNeuron.deactivate();
  });

  describe('Action Execution', () => {
    beforeEach(async () => {
      await motorNeuron.activate();
    });

    it('should execute action when triggered', async () => {
      const spy = jest.spyOn(motorNeuron, 'performAction');

      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(spy).toHaveBeenCalled();
    });

    it('should update state during action execution', async () => {
      const actionPromise = motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      // Check submitting state
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(motorNeuron.getState().submitting).toBe(true);

      await actionPromise;
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check completed state
      expect(motorNeuron.getState().submitting).toBe(false);
    });

    it('should call onSuccess callback on successful action', async () => {
      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onSuccessMock).toHaveBeenCalledWith({ success: true, data: 'response' });
    });

    it('should handle errors during action execution', async () => {
      motorNeuron.updateProps({ apiEndpoint: '/api/error' });

      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(motorNeuron.getState().error).toBeTruthy();
      expect(motorNeuron.getState().submitting).toBe(false);
    });

    it('should prevent multiple concurrent executions', async () => {
      const spy = jest.spyOn(motorNeuron, 'performAction');

      // First click
      motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second click while first is processing
      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should only execute once
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backend Connection', () => {
    let backendNeuron: MockBackendNeuron;

    beforeEach(async () => {
      backendNeuron = new MockBackendNeuron();
      await motorNeuron.activate();
      await backendNeuron.activate();
    });

    afterEach(async () => {
      await backendNeuron.deactivate();
    });

    it('should connect to backend neuron', () => {
      motorNeuron.connectToBackend(backendNeuron);
      const connections = (motorNeuron as any).backendConnections;
      expect(connections.has(backendNeuron.id)).toBe(true);
    });

    it('should forward signals to backend neuron on action', async () => {
      motorNeuron.connectToBackend(backendNeuron);

      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: { data: 'test' }, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(backendNeuron.receivedSignals.length).toBeGreaterThan(0);
    });

    it('should disconnect from backend neuron', () => {
      motorNeuron.connectToBackend(backendNeuron);
      motorNeuron.disconnectFromBackend(backendNeuron.id);

      const connections = (motorNeuron as any).backendConnections;
      expect(connections.has(backendNeuron.id)).toBe(false);
    });
  });

  describe('Side Effects', () => {
    beforeEach(async () => {
      await motorNeuron.activate();
    });

    it('should emit action:start signal when action begins', async () => {
      const signals: any[] = [];
      motorNeuron.on('signal', (signal) => signals.push(signal));

      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      const startSignals = signals.filter((s) => s.type === 'action:start');
      expect(startSignals.length).toBeGreaterThan(0);
    });

    it('should emit action:complete signal when action succeeds', async () => {
      const signals: any[] = [];
      motorNeuron.on('signal', (signal) => signals.push(signal));

      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const completeSignals = signals.filter((s) => s.type === 'action:complete');
      expect(completeSignals.length).toBeGreaterThan(0);
    });

    it('should emit action:error signal when action fails', async () => {
      motorNeuron.updateProps({ apiEndpoint: '/api/error' });

      const signals: any[] = [];
      motorNeuron.on('signal', (signal) => signals.push(signal));

      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const errorSignals = signals.filter((s) => s.type === 'action:error');
      expect(errorSignals.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering during Actions', () => {
    beforeEach(async () => {
      await motorNeuron.activate();
    });

    it('should show loading state during action execution', async () => {
      motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      const renderSignal = motorNeuron.render();
      expect(renderSignal.data.vdom.props!.disabled).toBe(true);
      expect(renderSignal.data.vdom.children).toContain('Submitting...');
    });

    it('should restore normal state after action completes', async () => {
      await motorNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: motorNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const renderSignal = motorNeuron.render();
      expect(renderSignal.data.vdom.props!.disabled).toBe(false);
      expect(renderSignal.data.vdom.children).toContain('Submit');
    });
  });

  describe('Action Timeout', () => {
    it('should timeout long-running actions', async () => {
      class SlowMotorNeuron extends TestSubmitButton {
        public async performAction(data: any): Promise<any> {
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

      (slowNeuron as any).actionTimeout = 100; // Set short timeout
      await slowNeuron.activate();

      await slowNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: slowNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

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
        public async performAction(data: any): Promise<any> {
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

      (retryNeuron as any).maxRetries = 3;
      await retryNeuron.activate();

      await retryNeuron.receive({
        type: 'ui:click',
        data: { payload: {}, target: retryNeuron.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(attemptCount).toBe(3);
      expect(onSuccessMock).toHaveBeenCalled();

      await retryNeuron.deactivate();
    });
  });
});
