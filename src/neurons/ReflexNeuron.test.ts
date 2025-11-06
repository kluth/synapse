import { ReflexNeuron } from './ReflexNeuron';
import type { Signal, Input } from '../types';

describe('ReflexNeuron', () => {
  let neuron: ReflexNeuron;

  beforeEach(() => {
    neuron = new ReflexNeuron({
      id: 'reflex-1',
      threshold: 0.3,
    });
  });

  describe('initialization', () => {
    it('should create a reflex neuron', () => {
      expect(neuron.id).toBe('reflex-1');
      expect(neuron.type).toBe('reflex');
      expect(neuron.threshold).toBe(0.3);
    });

    it('should start in inactive state', () => {
      expect(neuron.state).toBe('inactive');
    });
  });

  describe('stateless operation', () => {
    it('should not maintain state between invocations', async () => {
      await neuron.activate();

      const input1: Input<number> = { data: 42 };
      const output1 = await neuron.process(input1);
      expect(output1.success).toBe(true);

      // Deactivate and reactivate (simulating cold start)
      await neuron.deactivate();
      await neuron.activate();

      const input2: Input<number> = { data: 100 };
      const output2 = await neuron.process(input2);
      expect(output2.success).toBe(true);

      // Check that second invocation was successful
      const health = neuron.healthCheck();
      expect(health.metrics['processedInputs']).toBe(2); // Both invocations counted
    });
  });

  describe('ephemeral processing', () => {
    it('should process and deactivate quickly', async () => {
      const startTime = Date.now();

      await neuron.activate();
      const input: Input<string> = { data: 'test' };
      await neuron.process(input);
      await neuron.deactivate();

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle event-driven activation', async () => {
      // Simulate serverless invocation
      const invocations = 5;

      for (let i = 0; i < invocations; i++) {
        await neuron.activate();

        const input: Input<number> = { data: i };
        const output = await neuron.process(input);

        expect(output.success).toBe(true);
        expect(output.data).toBe(i);

        await neuron.deactivate();
      }
    });
  });

  describe('simple processing', () => {
    it('should handle isolated tasks', async () => {
      await neuron.activate();

      const input: Input<{ image: string }> = {
        data: { image: 'base64data' },
        metadata: { operation: 'resize' },
      };

      const output = await neuron.process(input);
      expect(output.success).toBe(true);
      expect(output.metadata).toEqual({ operation: 'resize' });
    });

    it('should process without cortical involvement', async () => {
      await neuron.activate();

      // Simple reflex-like processing
      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'trigger',
        type: 'excitatory',
        strength: 0.8,
        payload: { action: 'execute' },
        timestamp: new Date(),
      };

      await neuron.receive(signal);

      const health = neuron.healthCheck();
      expect(health.metrics['signalsReceived']).toBe(1);
    });
  });

  describe('cold start simulation', () => {
    it('should handle cold starts gracefully', async () => {
      // First invocation (cold start)
      const coldStart = Date.now();
      await neuron.activate();
      const coldStartTime = Date.now() - coldStart;

      const input: Input<string> = { data: 'cold' };
      await neuron.process(input);
      await neuron.deactivate();

      // Second invocation (also cold start since we deactivated)
      const warmStart = Date.now();
      await neuron.activate();
      const warmStartTime = Date.now() - warmStart;

      const input2: Input<string> = { data: 'warm' };
      await neuron.process(input2);
      await neuron.deactivate();

      // Both should be fast (no heavy initialization)
      expect(coldStartTime).toBeLessThan(50);
      expect(warmStartTime).toBeLessThan(50);
    });
  });

  describe('parallel execution', () => {
    it('should support parallel invocations', async () => {
      // Create multiple reflex neurons (simulating parallel Lambda invocations)
      const neurons = Array.from(
        { length: 10 },
        (_, i) =>
          new ReflexNeuron({
            id: `reflex-${i}`,
            threshold: 0.3,
          }),
      );

      const results = await Promise.all(
        neurons.map(async (n) => {
          await n.activate();
          const input: Input<number> = { data: Math.random() };
          const output = await n.process(input);
          await n.deactivate();
          return output;
        }),
      );

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('resource efficiency', () => {
    it('should scale to zero when inactive', async () => {
      await neuron.activate();
      expect(neuron.state).toBe('active');

      await neuron.deactivate();
      expect(neuron.state).toBe('inactive');

      // Check that no resources are held
      const health = neuron.healthCheck();
      expect(health.uptime).toBe(0);
    });
  });
});
