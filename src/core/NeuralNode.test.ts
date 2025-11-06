import { NeuralNode } from './NeuralNode';
import type { Signal, Input } from '../types';

describe('NeuralNode', () => {
  let node: NeuralNode;

  beforeEach(() => {
    node = new NeuralNode({
      id: 'test-node-1',
      type: 'cortical',
      threshold: 0.5,
    });
  });

  describe('initialization', () => {
    it('should create a node with correct properties', () => {
      expect(node.id).toBe('test-node-1');
      expect(node.type).toBe('cortical');
      expect(node.threshold).toBe(0.5);
      expect(node.state).toBe('inactive');
    });

    it('should throw error if threshold is invalid', () => {
      expect(() => {
        new NeuralNode({
          id: 'invalid-node',
          type: 'cortical',
          threshold: -0.5,
        });
      }).toThrow('Threshold must be between 0 and 1');

      expect(() => {
        new NeuralNode({
          id: 'invalid-node',
          type: 'cortical',
          threshold: 1.5,
        });
      }).toThrow('Threshold must be between 0 and 1');
    });
  });

  describe('lifecycle management', () => {
    it('should activate node successfully', async () => {
      await node.activate();
      expect(node.state).toBe('active');
    });

    it('should deactivate node successfully', async () => {
      await node.activate();
      await node.deactivate();
      expect(node.state).toBe('inactive');
    });

    it('should not activate already active node', async () => {
      await node.activate();
      await expect(node.activate()).rejects.toThrow('Node is already active');
    });
  });

  describe('signal reception', () => {
    it('should receive and queue signals', async () => {
      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'source-node',
        targetId: 'test-node-1',
        type: 'excitatory',
        strength: 0.8,
        payload: { data: 'test' },
        timestamp: new Date(),
      };

      await node.activate();
      await node.receive(signal);

      const health = node.healthCheck();
      expect(health.metrics['signalsReceived']).toBe(1);
    });

    it('should reject signals when inactive', async () => {
      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'source-node',
        targetId: 'test-node-1',
        type: 'excitatory',
        strength: 0.8,
        payload: { data: 'test' },
        timestamp: new Date(),
      };

      await expect(node.receive(signal)).rejects.toThrow('Node is not active');
    });
  });

  describe('signal integration', () => {
    it('should decide to fire when signals exceed threshold', () => {
      const signals: Signal[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sourceId: 'node-1',
          type: 'excitatory',
          strength: 0.3,
          payload: {},
          timestamp: new Date(),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          sourceId: 'node-2',
          type: 'excitatory',
          strength: 0.4,
          payload: {},
          timestamp: new Date(),
        },
      ];

      const decision = node.integrate(signals);
      expect(decision.shouldFire).toBe(true);
      expect(decision.accumulated).toBe(0.7);
      expect(decision.threshold).toBe(0.5);
    });

    it('should not fire when signals below threshold', () => {
      const signals: Signal[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sourceId: 'node-1',
          type: 'excitatory',
          strength: 0.2,
          payload: {},
          timestamp: new Date(),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          sourceId: 'node-2',
          type: 'excitatory',
          strength: 0.1,
          payload: {},
          timestamp: new Date(),
        },
      ];

      const decision = node.integrate(signals);
      expect(decision.shouldFire).toBe(false);
      expect(decision.accumulated).toBeCloseTo(0.3);
    });

    it('should handle inhibitory signals', () => {
      const signals: Signal[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          sourceId: 'node-1',
          type: 'excitatory',
          strength: 0.8,
          payload: {},
          timestamp: new Date(),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          sourceId: 'node-2',
          type: 'inhibitory',
          strength: 0.5,
          payload: {},
          timestamp: new Date(),
        },
      ];

      const decision = node.integrate(signals);
      expect(decision.accumulated).toBeCloseTo(0.3); // 0.8 - 0.5
      expect(decision.shouldFire).toBe(false);
    });
  });

  describe('processing', () => {
    it('should process input successfully', async () => {
      await node.activate();

      const input: Input<string> = {
        data: 'test-data',
        metadata: { source: 'test' },
      };

      const output = await node.process(input);
      expect(output.success).toBe(true);
      expect(output.data).toBeDefined();
    });

    it('should handle processing errors', async () => {
      await node.activate();

      // Override process method to simulate error
      node.process = jest.fn().mockRejectedValue(new Error('Processing failed'));

      const input: Input<string> = { data: 'test' };

      await expect(node.process(input)).rejects.toThrow('Processing failed');
    });
  });

  describe('health check', () => {
    it('should return health status', () => {
      const health = node.healthCheck();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('lastCheck');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('errors');
      expect(health).toHaveProperty('metrics');
    });

    it('should track uptime after activation', async () => {
      await node.activate();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const health = node.healthCheck();
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.healthy).toBe(true);
    });
  });
});
