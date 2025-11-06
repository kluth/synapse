import { CorticalNeuron } from './CorticalNeuron';
import type { Signal, Input } from '../types';

describe('CorticalNeuron', () => {
  let neuron: CorticalNeuron;

  beforeEach(() => {
    neuron = new CorticalNeuron({
      id: 'cortical-1',
      threshold: 0.6,
    });
  });

  describe('initialization', () => {
    it('should create a cortical neuron with stateful properties', () => {
      expect(neuron.id).toBe('cortical-1');
      expect(neuron.type).toBe('cortical');
      expect(neuron.threshold).toBe(0.6);
    });

    it('should initialize with empty state', () => {
      expect(neuron.getState()).toEqual({});
    });
  });

  describe('state management', () => {
    it('should persist state across processing', async () => {
      await neuron.activate();

      neuron.setState('counter', 5);
      expect(neuron.getState('counter')).toBe(5);

      neuron.setState('user', { name: 'Alice' });
      expect(neuron.getState('user')).toEqual({ name: 'Alice' });
    });

    it('should maintain state between multiple process calls', async () => {
      await neuron.activate();

      const input1: Input<number> = { data: 10 };
      await neuron.process(input1);

      const state1 = neuron.getState('processCount');
      expect(state1).toBe(1);

      const input2: Input<number> = { data: 20 };
      await neuron.process(input2);

      const state2 = neuron.getState('processCount');
      expect(state2).toBe(2);
    });

    it('should clear state on deactivation', async () => {
      await neuron.activate();

      neuron.setState('data', 'test');
      expect(neuron.getState('data')).toBe('test');

      await neuron.deactivate();
      await neuron.activate();

      expect(neuron.getState('data')).toBeUndefined();
    });
  });

  describe('memory management', () => {
    it('should maintain working memory', async () => {
      await neuron.activate();

      neuron.remember('lastInput', { value: 42 });
      expect(neuron.recall('lastInput')).toEqual({ value: 42 });
    });

    it('should handle memory limits', async () => {
      await neuron.activate();

      // Fill memory
      for (let i = 0; i < 150; i++) {
        neuron.remember(`item-${i}`, i);
      }

      // Oldest items should be evicted (LRU)
      expect(neuron.recall('item-0')).toBeUndefined();
      expect(neuron.recall('item-149')).toBe(149);
    });
  });

  describe('sustained activation', () => {
    it('should maintain baseline activity when active', async () => {
      await neuron.activate();

      // Verify neuron is healthy and tracking uptime
      const health1 = neuron.healthCheck();
      expect(health1.healthy).toBe(true);
      expect(health1.uptime).toBeGreaterThanOrEqual(0);

      // Process a signal to verify continued activity
      const signal = {
        id: '12345678-1234-1234-1234-123456789012',
        sourceId: 'test-source',
        type: 'excitatory' as const,
        strength: 1.0,
        payload: { test: 'data' },
        timestamp: new Date(),
      };
      await neuron.receive(signal);

      // Verify neuron remains healthy after processing
      const health2 = neuron.healthCheck();
      expect(health2.healthy).toBe(true);
      expect(health2.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should process signals continuously', async () => {
      await neuron.activate();

      const signals: Signal[] = [];
      for (let i = 0; i < 5; i++) {
        signals.push({
          id: `${i}23e4567-e89b-12d3-a456-426614174000`,
          sourceId: `source-${i}`,
          type: 'excitatory',
          strength: 0.15,
          payload: { index: i },
          timestamp: new Date(),
        });
      }

      // Send signals sequentially
      for (const signal of signals) {
        await neuron.receive(signal);
      }

      const health = neuron.healthCheck();
      expect(health.metrics['signalsReceived']).toBe(5);
    });
  });
});
