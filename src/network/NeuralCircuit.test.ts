import { NeuralCircuit } from './NeuralCircuit';
import { NeuralNode } from '../core/NeuralNode';
import type { Signal } from '../types';

describe('NeuralCircuit - Network Manager', () => {
  let circuit: NeuralCircuit;
  let neuron1: NeuralNode;
  let neuron2: NeuralNode;
  let neuron3: NeuralNode;

  beforeEach(() => {
    circuit = new NeuralCircuit({ id: 'test-circuit' });

    neuron1 = new NeuralNode({ id: 'neuron-1', type: 'cortical', threshold: 0.5 });
    neuron2 = new NeuralNode({ id: 'neuron-2', type: 'cortical', threshold: 0.5 });
    neuron3 = new NeuralNode({ id: 'neuron-3', type: 'reflex', threshold: 0.3 });
  });

  afterEach(async () => {
    await circuit.shutdown();
  });

  describe('initialization', () => {
    it('should create a circuit with correct properties', () => {
      expect(circuit.id).toBe('test-circuit');
      expect(circuit.isActive).toBe(false);
    });
  });

  describe('neuron management', () => {
    it('should add neurons to circuit', () => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);

      expect(circuit.getNeuronCount()).toBe(2);
    });

    it('should retrieve neuron by id', () => {
      circuit.addNeuron(neuron1);

      const retrieved = circuit.getNeuron('neuron-1');
      expect(retrieved).toBe(neuron1);
    });

    it('should return undefined for non-existent neuron', () => {
      const retrieved = circuit.getNeuron('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should remove neurons from circuit', () => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);

      circuit.removeNeuron('neuron-1');

      expect(circuit.getNeuronCount()).toBe(1);
      expect(circuit.getNeuron('neuron-1')).toBeUndefined();
    });

    it('should list all neurons', () => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);
      circuit.addNeuron(neuron3);

      const neurons = circuit.getNeurons();
      expect(neurons).toHaveLength(3);
    });
  });

  describe('connection management', () => {
    beforeEach(() => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);
      circuit.addNeuron(neuron3);
    });

    it('should connect neurons', () => {
      circuit.connect('neuron-1', 'neuron-2', {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      const connections = circuit.getConnections();
      expect(connections).toHaveLength(1);
    });

    it('should retrieve connections for a neuron', () => {
      circuit.connect('neuron-1', 'neuron-2', {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect('neuron-1', 'neuron-3', {
        weight: 0.6,
        type: 'excitatory',
        speed: 'fast',
      });

      const outgoing = circuit.getOutgoingConnections('neuron-1');
      expect(outgoing).toHaveLength(2);

      const incoming = circuit.getIncomingConnections('neuron-2');
      expect(incoming).toHaveLength(1);
    });

    it('should disconnect neurons', () => {
      circuit.connect('neuron-1', 'neuron-2', {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.disconnect('neuron-1', 'neuron-2');

      const connections = circuit.getConnections();
      expect(connections).toHaveLength(0);
    });
  });

  describe('circuit activation', () => {
    beforeEach(() => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);
      circuit.addNeuron(neuron3);
    });

    it('should activate all neurons in circuit', async () => {
      await circuit.activate();

      expect(circuit.isActive).toBe(true);
      expect(neuron1.state).toBe('active');
      expect(neuron2.state).toBe('active');
      expect(neuron3.state).toBe('active');
    });

    it('should deactivate all neurons in circuit', async () => {
      await circuit.activate();
      await circuit.shutdown();

      expect(circuit.isActive).toBe(false);
      expect(neuron1.state).toBe('inactive');
      expect(neuron2.state).toBe('inactive');
      expect(neuron3.state).toBe('inactive');
    });
  });

  describe('signal propagation', () => {
    beforeEach(async () => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);
      circuit.addNeuron(neuron3);

      // Create a simple network: neuron1 -> neuron2 -> neuron3
      circuit.connect('neuron-1', 'neuron-2', {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect('neuron-2', 'neuron-3', {
        weight: 0.7,
        type: 'excitatory',
        speed: 'fast',
      });

      await circuit.activate();
    });

    it('should allow manual signal transmission through connections', async () => {
      const signal: Signal = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sourceId: 'neuron-1',
        targetId: 'neuron-2',
        type: 'excitatory',
        strength: 0.9,
        payload: { message: 'hello' },
        timestamp: new Date(),
      };

      // Get the connection and transmit manually
      const connection = circuit.getOutgoingConnections('neuron-1')[0];
      expect(connection).toBeDefined();

      if (connection !== undefined) {
        await connection.transmit(signal);

        // Check that signal was received by neuron2
        const health2 = neuron2.healthCheck();
        expect(health2.metrics['signalsReceived']).toBe(1);
      }
    });
  });

  describe('circuit topology', () => {
    beforeEach(() => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);
      circuit.addNeuron(neuron3);
    });

    it('should detect cycles in circuit', () => {
      circuit.connect('neuron-1', 'neuron-2', {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect('neuron-2', 'neuron-3', {
        weight: 0.7,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect('neuron-3', 'neuron-1', {
        weight: 0.6,
        type: 'excitatory',
        speed: 'fast',
      });

      expect(circuit.hasCycles()).toBe(true);
    });

    it('should identify feed-forward networks', () => {
      circuit.connect('neuron-1', 'neuron-2', {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect('neuron-2', 'neuron-3', {
        weight: 0.7,
        type: 'excitatory',
        speed: 'fast',
      });

      expect(circuit.hasCycles()).toBe(false);
    });
  });

  describe('circuit statistics', () => {
    beforeEach(() => {
      circuit.addNeuron(neuron1);
      circuit.addNeuron(neuron2);
      circuit.addNeuron(neuron3);

      circuit.connect('neuron-1', 'neuron-2', {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect('neuron-2', 'neuron-3', {
        weight: 0.7,
        type: 'excitatory',
        speed: 'fast',
      });
    });

    it('should provide circuit statistics', () => {
      const stats = circuit.getStats();

      expect(stats.neuronCount).toBe(3);
      expect(stats.connectionCount).toBe(2);
      expect(stats.corticalNeurons).toBe(2);
      expect(stats.reflexNeurons).toBe(1);
    });

    it('should calculate average connection weight', () => {
      const stats = circuit.getStats();

      expect(stats.avgConnectionWeight).toBeCloseTo(0.75, 2); // (0.8 + 0.7) / 2
    });
  });
});
