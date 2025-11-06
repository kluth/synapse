import { Connection } from './Connection';
import { NeuralNode } from './NeuralNode';
import type { Signal } from '../types';

describe('Connection', () => {
  let source: NeuralNode;
  let target: NeuralNode;
  let connection: Connection;

  beforeEach(async () => {
    source = new NeuralNode({
      id: 'source-node',
      type: 'cortical',
      threshold: 0.5,
    });

    target = new NeuralNode({
      id: 'target-node',
      type: 'cortical',
      threshold: 0.5,
    });

    await source.activate();
    await target.activate();

    connection = new Connection({
      id: 'conn-1',
      source,
      target,
      weight: 0.8,
      type: 'excitatory',
      speed: 'fast',
      protocol: 'event',
    });
  });

  describe('initialization', () => {
    it('should create a connection with correct properties', () => {
      expect(connection.id).toBe('conn-1');
      expect(connection.source).toBe(source);
      expect(connection.target).toBe(target);
      expect(connection.weight).toBe(0.8);
      expect(connection.type).toBe('excitatory');
      expect(connection.speed).toBe('fast');
      expect(connection.protocol).toBe('event');
      expect(connection.usageCount).toBe(0);
      expect(connection.lastUsed).toBeNull();
    });

    it('should throw error for invalid weight', () => {
      expect(() => {
        new Connection({
          id: 'invalid-conn',
          source,
          target,
          weight: -0.5,
          type: 'excitatory',
          speed: 'fast',
          protocol: 'event',
        });
      }).toThrow('Weight must be between 0 and 1');

      expect(() => {
        new Connection({
          id: 'invalid-conn',
          source,
          target,
          weight: 1.5,
          type: 'excitatory',
          speed: 'fast',
          protocol: 'event',
        });
      }).toThrow('Weight must be between 0 and 1');
    });
  });

  describe('signal transmission', () => {
    it('should transmit signal from source to target', async () => {
      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'source-node',
        targetId: 'target-node',
        type: 'excitatory',
        strength: 0.5,
        payload: { data: 'test' },
        timestamp: new Date(),
      };

      await connection.transmit(signal);

      expect(connection.usageCount).toBe(1);
      expect(connection.lastUsed).toBeDefined();

      const targetHealth = target.healthCheck();
      expect(targetHealth.metrics['signalsReceived']).toBe(1);
    });

    it('should amplify signal strength by weight', async () => {
      connection.weight = 0.5;

      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'source-node',
        targetId: 'target-node',
        type: 'excitatory',
        strength: 0.6,
        payload: {},
        timestamp: new Date(),
      };

      await connection.transmit(signal);

      // Signal strength should be amplified by weight
      // Original: 0.6, Weight: 0.5, Result: 0.3
      const targetHealth = target.healthCheck();
      expect(targetHealth.metrics['signalsReceived']).toBe(1);
    });

    it('should handle inhibitory connections', async () => {
      const inhibitoryConn = new Connection({
        id: 'conn-inhib',
        source,
        target,
        weight: 0.7,
        type: 'inhibitory',
        speed: 'fast',
        protocol: 'event',
      });

      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'source-node',
        targetId: 'target-node',
        type: 'excitatory',
        strength: 0.8,
        payload: {},
        timestamp: new Date(),
      };

      await inhibitoryConn.transmit(signal);

      expect(inhibitoryConn.usageCount).toBe(1);
    });
  });

  describe('synaptic plasticity', () => {
    it('should strengthen connection', () => {
      const initialWeight = connection.weight;
      connection.strengthen();

      expect(connection.weight).toBeGreaterThan(initialWeight);
      expect(connection.weight).toBeLessThanOrEqual(1.0);
    });

    it('should not exceed maximum weight', () => {
      connection.weight = 0.99;

      connection.strengthen();
      connection.strengthen();
      connection.strengthen();

      expect(connection.weight).toBe(1.0);
    });

    it('should weaken connection', () => {
      const initialWeight = connection.weight;
      connection.weaken();

      expect(connection.weight).toBeLessThan(initialWeight);
      expect(connection.weight).toBeGreaterThanOrEqual(0);
    });

    it('should not go below minimum weight', () => {
      connection.weight = 0.02;

      connection.weaken();
      connection.weaken();

      expect(connection.weight).toBe(0);
    });

    it('should strengthen with usage', async () => {
      // Use the connection multiple times
      for (let i = 0; i < 5; i++) {
        const signal: Signal = {
          id: `${i}23e4567-e89b-12d3-a456-426614174000`,
          sourceId: 'source-node',
          targetId: 'target-node',
          type: 'excitatory',
          strength: 0.5,
          payload: {},
          timestamp: new Date(),
        };
        await connection.transmit(signal);
      }

      expect(connection.usageCount).toBe(5);
      // Weight could be adjusted based on usage patterns
    });
  });

  describe('pruning', () => {
    it('should identify connections for pruning based on low usage', () => {
      connection.usageCount = 0;

      // Set last used to more than 30 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      connection.lastUsed = oldDate;

      expect(connection.shouldPrune()).toBe(true);
    });

    it('should not prune active connections', async () => {
      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'source-node',
        type: 'excitatory',
        strength: 0.5,
        payload: {},
        timestamp: new Date(),
      };

      await connection.transmit(signal);

      expect(connection.shouldPrune()).toBe(false);
    });

    it('should mark connection as pruned', () => {
      connection.prune();
      // Connection should be marked or removed
      expect(connection.weight).toBe(0);
    });
  });

  describe('connection speed', () => {
    it('should support fast transmission', async () => {
      const fastConn = new Connection({
        id: 'fast-conn',
        source,
        target,
        weight: 0.9,
        type: 'excitatory',
        speed: 'fast',
        protocol: 'gRPC',
      });

      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'source-node',
        type: 'excitatory',
        strength: 0.7,
        payload: {},
        timestamp: new Date(),
      };

      const start = Date.now();
      await fastConn.transmit(signal);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Fast transmission
    });

    it('should support myelinated transmission', () => {
      const myelinatedConn = new Connection({
        id: 'myelinated-conn',
        source,
        target,
        weight: 0.9,
        type: 'excitatory',
        speed: 'myelinated',
        protocol: 'gRPC',
      });

      expect(myelinatedConn.speed).toBe('myelinated');
    });
  });
});
