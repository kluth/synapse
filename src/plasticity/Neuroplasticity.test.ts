import { Neuroplasticity } from './Neuroplasticity';
import { NeuralCircuit } from '../network/NeuralCircuit';
import { CorticalNeuron } from '../neurons/CorticalNeuron';

describe('Neuroplasticity - Self-Healing and Optimization', () => {
  let plasticity: Neuroplasticity;
  let circuit: NeuralCircuit;
  let neuronA: CorticalNeuron;
  let neuronB: CorticalNeuron;
  let neuronC: CorticalNeuron;

  beforeEach(() => {
    circuit = new NeuralCircuit({ id: 'circuit-1' });
    plasticity = new Neuroplasticity({ circuit, pruningThreshold: 0.1 });

    neuronA = new CorticalNeuron({
      id: 'neuron-a',
      threshold: 0.5,
    });

    neuronB = new CorticalNeuron({
      id: 'neuron-b',
      threshold: 0.5,
    });

    neuronC = new CorticalNeuron({
      id: 'neuron-c',
      threshold: 0.5,
    });

    circuit.addNeuron(neuronA);
    circuit.addNeuron(neuronB);
    circuit.addNeuron(neuronC);
  });

  afterEach(async () => {
    await circuit.shutdown();
  });

  describe('synaptic pruning', () => {
    it('should identify weak connections for pruning', () => {
      circuit.connect(neuronA.id, neuronB.id, {
        weight: 0.05,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect(neuronB.id, neuronC.id, {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      const weakConnections = plasticity.identifyWeakConnections();

      expect(weakConnections).toHaveLength(1);
      expect(weakConnections[0]?.weight).toBe(0.05);
    });

    it('should prune weak connections', () => {
      circuit.connect(neuronA.id, neuronB.id, {
        weight: 0.05,
        type: 'excitatory',
        speed: 'fast',
      });

      const beforePrune = circuit.getOutgoingConnections(neuronA.id);
      expect(beforePrune).toHaveLength(1);

      plasticity.pruneWeakConnections();

      const afterPrune = circuit.getOutgoingConnections(neuronA.id);
      expect(afterPrune).toHaveLength(0);
    });

    it('should strengthen frequently used connections', () => {
      const conn = circuit.connect(neuronA.id, neuronB.id, {
        weight: 0.5,
        type: 'excitatory',
        speed: 'fast',
      });

      // Record usage
      plasticity.recordConnectionUsage(conn.id);
      plasticity.recordConnectionUsage(conn.id);
      plasticity.recordConnectionUsage(conn.id);
      plasticity.recordConnectionUsage(conn.id);

      plasticity.strengthenHotPaths();

      const strengthened = circuit.getConnection(conn.id);
      expect(strengthened?.weight).toBeGreaterThan(0.5);
    });
  });

  describe('neural rewiring', () => {
    it('should detect failed neurons', async () => {
      await circuit.activate();
      await neuronB.deactivate();

      const failed = plasticity.detectFailedNeurons();

      expect(failed).toHaveLength(1);
      expect(failed[0]?.id).toBe(neuronB.id);
    });

    it('should create bypass connections around failed neurons', async () => {
      circuit.connect(neuronA.id, neuronB.id, {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      circuit.connect(neuronB.id, neuronC.id, {
        weight: 0.8,
        type: 'excitatory',
        speed: 'fast',
      });

      await circuit.activate();
      await neuronB.deactivate();

      plasticity.rewireAroundFailure(neuronB.id);

      // Should have created direct connection A->C
      const bypassPath = plasticity.findPathBetween(neuronA.id, neuronC.id);
      expect(bypassPath).toBeDefined();
      expect(bypassPath).not.toContain(neuronB.id);
    });

    it('should strengthen connections through training', () => {
      const conn = circuit.connect(neuronA.id, neuronB.id, {
        weight: 0.5,
        type: 'excitatory',
        speed: 'fast',
      });

      plasticity.trainConnection(conn.id, 10);

      const trained = circuit.getConnection(conn.id);
      expect(trained?.weight).toBeGreaterThan(0.5);
    });
  });

  describe('network health', () => {
    it('should assess network health', () => {
      const health = plasticity.assessNetworkHealth();

      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(1);
    });

    it('should provide plasticity statistics', () => {
      // Create fresh circuit for this test
      const freshCircuit = new NeuralCircuit({ id: 'fresh' });
      const freshPlasticity = new Neuroplasticity({ circuit: freshCircuit });

      const nA = new CorticalNeuron({ id: 'na', threshold: 0.5 });
      const nB = new CorticalNeuron({ id: 'nb', threshold: 0.5 });
      freshCircuit.addNeuron(nA);
      freshCircuit.addNeuron(nB);

      freshCircuit.connect(nA.id, nB.id, {
        weight: 0.5,
        type: 'excitatory',
        speed: 'fast',
      });

      const stats = freshPlasticity.getStatistics();

      expect(stats.totalConnections).toBe(1);
      expect(stats.prunedConnections).toBe(0);
      expect(stats.rewiresPerformed).toBe(0);
    });
  });
});
