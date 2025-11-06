import { Connection } from '../core/Connection';
import type { INeuralNode } from '../interfaces';
import type { ConnectionType, TransmissionSpeed } from '../types';

interface NeuralCircuitConfig {
  readonly id: string;
}

interface ConnectionConfig {
  weight: number;
  type: ConnectionType;
  speed: TransmissionSpeed;
}

interface CircuitStats {
  neuronCount: number;
  connectionCount: number;
  corticalNeurons: number;
  reflexNeurons: number;
  avgConnectionWeight: number;
}

/**
 * Neural Circuit - Network Manager
 *
 * Manages collections of neurons and their connections, providing:
 * - Neuron lifecycle management
 * - Connection topology
 * - Signal propagation orchestration
 * - Network statistics and analysis
 */
export class NeuralCircuit {
  public readonly id: string;
  public isActive = false;

  private neurons: Map<string, INeuralNode> = new Map();
  private connections: Map<string, Connection> = new Map();

  // Adjacency lists for graph operations
  private outgoingEdges: Map<string, Set<string>> = new Map();
  private incomingEdges: Map<string, Set<string>> = new Map();

  constructor(config: NeuralCircuitConfig) {
    this.id = config.id;
  }

  /**
   * LIFECYCLE MANAGEMENT
   */

  public async activate(): Promise<void> {
    if (this.isActive) {
      throw new Error('Circuit is already active');
    }

    // Activate all neurons in parallel
    const activations = Array.from(this.neurons.values()).map((neuron) => neuron.activate());

    await Promise.all(activations);

    this.isActive = true;
  }

  public async shutdown(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    // Deactivate all neurons in parallel
    const deactivations = Array.from(this.neurons.values()).map((neuron) => neuron.deactivate());

    await Promise.all(deactivations);

    this.isActive = false;
  }

  /**
   * NEURON MANAGEMENT
   */

  public addNeuron(neuron: INeuralNode): void {
    if (this.neurons.has(neuron.id)) {
      throw new Error(`Neuron ${neuron.id} already exists in circuit`);
    }

    this.neurons.set(neuron.id, neuron);
    this.outgoingEdges.set(neuron.id, new Set());
    this.incomingEdges.set(neuron.id, new Set());
  }

  public removeNeuron(neuronId: string): boolean {
    const neuron = this.neurons.get(neuronId);

    if (neuron === undefined) {
      return false;
    }

    // Remove all connections involving this neuron
    const outgoing = this.outgoingEdges.get(neuronId) ?? new Set();
    const incoming = this.incomingEdges.get(neuronId) ?? new Set();

    for (const targetId of outgoing) {
      this.disconnect(neuronId, targetId);
    }

    for (const sourceId of incoming) {
      this.disconnect(sourceId, neuronId);
    }

    // Remove neuron
    this.neurons.delete(neuronId);
    this.outgoingEdges.delete(neuronId);
    this.incomingEdges.delete(neuronId);

    return true;
  }

  public getNeuron(neuronId: string): INeuralNode | undefined {
    return this.neurons.get(neuronId);
  }

  public getNeurons(): INeuralNode[] {
    return Array.from(this.neurons.values());
  }

  public getNeuronCount(): number {
    return this.neurons.size;
  }

  /**
   * CONNECTION MANAGEMENT
   */

  public connect(sourceId: string, targetId: string, config: ConnectionConfig): Connection {
    const source = this.neurons.get(sourceId);
    const target = this.neurons.get(targetId);

    if (source === undefined) {
      throw new Error(`Source neuron ${sourceId} not found in circuit`);
    }

    if (target === undefined) {
      throw new Error(`Target neuron ${targetId} not found in circuit`);
    }

    const connectionId = `${sourceId}->${targetId}`;

    if (this.connections.has(connectionId)) {
      throw new Error(`Connection ${connectionId} already exists`);
    }

    const connection = new Connection({
      id: connectionId,
      source,
      target,
      weight: config.weight,
      type: config.type,
      speed: config.speed,
      protocol: 'event', // Default to event-based
    });

    this.connections.set(connectionId, connection);

    // Update adjacency lists
    const outgoing = this.outgoingEdges.get(sourceId);
    const incoming = this.incomingEdges.get(targetId);

    if (outgoing !== undefined) {
      outgoing.add(targetId);
    }

    if (incoming !== undefined) {
      incoming.add(sourceId);
    }

    return connection;
  }

  public disconnect(sourceId: string, targetId: string): boolean {
    const connectionId = `${sourceId}->${targetId}`;
    const deleted = this.connections.delete(connectionId);

    if (deleted) {
      // Update adjacency lists
      const outgoing = this.outgoingEdges.get(sourceId);
      const incoming = this.incomingEdges.get(targetId);

      if (outgoing !== undefined) {
        outgoing.delete(targetId);
      }

      if (incoming !== undefined) {
        incoming.delete(sourceId);
      }
    }

    return deleted;
  }

  public getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  public getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId);
  }

  public getOutgoingConnections(neuronId: string): Connection[] {
    const outgoing = this.outgoingEdges.get(neuronId);

    if (outgoing === undefined) {
      return [];
    }

    const connections: Connection[] = [];

    for (const targetId of outgoing) {
      const connectionId = `${neuronId}->${targetId}`;
      const connection = this.connections.get(connectionId);

      if (connection !== undefined) {
        connections.push(connection);
      }
    }

    return connections;
  }

  public getIncomingConnections(neuronId: string): Connection[] {
    const incoming = this.incomingEdges.get(neuronId);

    if (incoming === undefined) {
      return [];
    }

    const connections: Connection[] = [];

    for (const sourceId of incoming) {
      const connectionId = `${sourceId}->${neuronId}`;
      const connection = this.connections.get(connectionId);

      if (connection !== undefined) {
        connections.push(connection);
      }
    }

    return connections;
  }

  /**
   * TOPOLOGY ANALYSIS
   */

  public hasCycles(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = this.outgoingEdges.get(nodeId) ?? new Set();

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          if (dfs(neighborId)) {
            return true;
          }
        } else if (recStack.has(neighborId)) {
          return true; // Cycle detected
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    // Check all nodes
    for (const nodeId of this.neurons.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * STATISTICS
   */

  public getStats(): CircuitStats {
    let corticalCount = 0;
    let reflexCount = 0;
    let totalWeight = 0;

    for (const neuron of this.neurons.values()) {
      if (neuron.type === 'cortical') {
        corticalCount++;
      } else {
        // reflex
        reflexCount++;
      }
    }

    for (const connection of this.connections.values()) {
      totalWeight += connection.weight;
    }

    const avgWeight = this.connections.size > 0 ? totalWeight / this.connections.size : 0;

    return {
      neuronCount: this.neurons.size,
      connectionCount: this.connections.size,
      corticalNeurons: corticalCount,
      reflexNeurons: reflexCount,
      avgConnectionWeight: avgWeight,
    };
  }
}
