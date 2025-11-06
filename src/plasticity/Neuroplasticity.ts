/**
 * Neuroplasticity - Self-Healing and Adaptive Optimization
 *
 * Biological inspiration: The brain's ability to reorganize itself by forming new
 * neural connections throughout life. This includes:
 * 1. Synaptic pruning - eliminating weak connections to optimize the network
 * 2. Redundant pathways - multiple routes for resilience and failover
 * 3. Neural rewiring - creating new connections after damage
 * 4. Compensatory mechanisms - activating homologous regions
 *
 * Software mapping: Implements self-healing, failover, and adaptive optimization
 * for distributed systems. Enables automatic recovery from failures and continuous
 * performance optimization through usage-based learning.
 */

import type { NeuralCircuit } from '../network/NeuralCircuit';
import type { Connection } from '../core/Connection';
import type { NeuralNode } from '../core/NeuralNode';
import type { INeuralNode } from '../interfaces';

interface NeuroplasticityConfig {
  readonly circuit: NeuralCircuit;
  readonly pruningThreshold?: number; // Min weight for connection survival
  readonly strengthenRate?: number; // How much to strengthen per use
  readonly weakenRate?: number; // How much to weaken per non-use
  readonly maxRedundantPaths?: number;
}

interface ConnectionMetrics {
  usageCount: number;
  lastUsed: Date;
  failures: number;
  latency: number[];
}

interface PathwayStats {
  path: string[];
  usageCount: number;
  averageLatency: number;
  reliability: number;
}

interface NetworkHealth {
  score: number; // 0-1
  activeNeurons: number;
  totalConnections: number;
  averageWeight: number;
  redundancyLevel: number;
}

interface PlasticityStats {
  totalConnections: number;
  activePathways: number;
  prunedConnections: number;
  rewiresPerformed: number;
  failoversExecuted: number;
}

interface Interference {
  overActive: string; // Neuron ID that's interfering
  inhibiting: string; // Neuron ID being inhibited
  strength: number;
}

export class Neuroplasticity {
  private readonly circuit: NeuralCircuit;
  private readonly pruningThreshold: number;
  private readonly strengthenRate: number;

  // Track connection usage for optimization
  private connectionMetrics: Map<string, ConnectionMetrics> = new Map();

  // Track pathway usage
  private pathwayUsage: Map<string, PathwayStats> = new Map();

  // Primary paths between neurons
  private primaryPaths: Map<string, string[]> = new Map();

  // Redundant backup paths
  private redundantPaths: Map<string, string[][]> = new Map();

  // Homologous neuron pairs (like brain hemispheres)
  private homologousPairs: Map<string, string> = new Map();

  // Statistics
  private prunedCount = 0;
  private rewireCount = 0;
  private failoverCount = 0;

  constructor(config: NeuroplasticityConfig) {
    this.circuit = config.circuit;
    this.pruningThreshold = config.pruningThreshold ?? 0.1;
    this.strengthenRate = config.strengthenRate ?? 0.1;
    // Note: weakenRate and maxRedundantPaths from config are reserved for future use
  }

  /**
   * SYNAPTIC PRUNING - Optimization through elimination
   */

  public identifyWeakConnections(): Connection[] {
    const allNeurons = this.circuit.getNeurons();
    const weakConnections: Connection[] = [];

    for (const neuron of allNeurons) {
      const connections = this.circuit.getOutgoingConnections(neuron.id);

      for (const conn of connections) {
        if (conn.weight < this.pruningThreshold) {
          weakConnections.push(conn);
        }
      }
    }

    return weakConnections;
  }

  public pruneWeakConnections(): number {
    const weak = this.identifyWeakConnections();

    for (const conn of weak) {
      this.circuit.disconnect(conn.source.id, conn.target.id);
      this.prunedCount++;
    }

    return weak.length;
  }

  public recordConnectionUsage(connectionId: string): void {
    const metrics = this.connectionMetrics.get(connectionId) ?? {
      usageCount: 0,
      lastUsed: new Date(),
      failures: 0,
      latency: [],
    };

    metrics.usageCount++;
    metrics.lastUsed = new Date();

    this.connectionMetrics.set(connectionId, metrics);
  }

  public strengthenHotPaths(): void {
    // Strengthen frequently used connections
    for (const [connId, metrics] of this.connectionMetrics.entries()) {
      if (metrics.usageCount > 3) {
        const conn = this.circuit.getConnection(connId);

        if (conn !== undefined) {
          const newWeight = Math.min(1.0, conn.weight + this.strengthenRate);
          conn.weight = newWeight;
        }
      }
    }
  }

  public optimizeNetwork(): void {
    this.pruneWeakConnections();
    this.strengthenHotPaths();
  }

  /**
   * REDUNDANT PATHWAYS - Failover and resilience
   */

  public createRedundantPath(source: NeuralNode, target: NeuralNode, numPaths: number): void {
    const paths: string[][] = [];
    const key = `${source.id}->${target.id}`;

    // Find existing paths
    const existing = this.findAllPaths(source.id, target.id, numPaths);
    paths.push(...existing);

    // Create additional direct paths if needed
    while (paths.length < numPaths) {
      // Create direct connection as redundant path
      this.circuit.connect(source.id, target.id, {
        weight: 0.5,
        type: 'excitatory',
        speed: 'fast',
      });
      paths.push([source.id, target.id]);
    }

    this.redundantPaths.set(key, paths);
  }

  public getPathways(sourceId: string, targetId: string): string[][] {
    const key = `${sourceId}->${targetId}`;
    return this.redundantPaths.get(key) ?? [];
  }

  public markPrimaryPath(sourceId: string, targetId: string, path: string[]): void {
    const key = `${sourceId}->${targetId}`;
    this.primaryPaths.set(key, path);
  }

  public findActivePath(sourceId: string, targetId: string): string[] {
    const key = `${sourceId}->${targetId}`;
    const primary = this.primaryPaths.get(key);

    // Check if primary path is still valid
    if (primary !== undefined && this.isPathActive(primary)) {
      return primary;
    }

    // Failover to redundant path
    this.failoverCount++;
    const redundant = this.redundantPaths.get(key) ?? [];

    for (const path of redundant) {
      if (this.isPathActive(path)) {
        return path;
      }
    }

    // No active path found
    return [];
  }

  public recordPathwayUsage(path: string[]): void {
    const key = path.join('->');
    const stats = this.pathwayUsage.get(key) ?? {
      path,
      usageCount: 0,
      averageLatency: 0,
      reliability: 1.0,
    };

    stats.usageCount++;
    this.pathwayUsage.set(key, stats);
  }

  public getPathwayStats(path: string[]): PathwayStats {
    const key = path.join('->');
    return (
      this.pathwayUsage.get(key) ?? {
        path,
        usageCount: 0,
        averageLatency: 0,
        reliability: 0,
      }
    );
  }

  /**
   * NEURAL REWIRING - Self-healing after failures
   */

  public detectFailedNeurons(): INeuralNode[] {
    const allNeurons = this.circuit.getNeurons();
    return allNeurons.filter((n) => n.state !== 'active' && n.state !== 'firing');
  }

  public rewireAroundFailure(failedNeuronId: string): void {
    // Find all neurons connected to the failed neuron
    const incomingConns = this.findIncomingConnections(failedNeuronId);
    const outgoingConns = this.circuit.getOutgoingConnections(failedNeuronId);

    // Create bypass connections
    for (const incoming of incomingConns) {
      for (const outgoing of outgoingConns) {
        // Create direct connection from source to target, bypassing failed neuron
        const existing = this.circuit.getConnection(`${incoming.source.id}->${outgoing.target.id}`);

        if (existing === undefined) {
          this.circuit.connect(incoming.source.id, outgoing.target.id, {
            weight: incoming.weight * outgoing.weight * 0.7, // Reduce initial weight
            type: 'excitatory',
            speed: 'fast',
          });
          this.rewireCount++;
        }
      }
    }
  }

  public findPathBetween(sourceId: string, targetId: string): string[] | undefined {
    const paths = this.findAllPaths(sourceId, targetId, 1);
    return paths[0];
  }

  public trainConnection(connectionId: string, iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      this.recordConnectionUsage(connectionId);
    }

    this.strengthenHotPaths();
  }

  public trainPathway(path: string[], iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      this.recordPathwayUsage(path);

      // Strengthen all connections in the path
      for (let j = 0; j < path.length - 1; j++) {
        const sourceId = path[j];
        const targetId = path[j + 1];

        if (sourceId !== undefined && targetId !== undefined) {
          const connections = this.circuit.getOutgoingConnections(sourceId);
          const conn = connections.find((c) => c.target.id === targetId);

          if (conn !== undefined) {
            this.recordConnectionUsage(conn.id);
          }
        }
      }
    }

    this.strengthenHotPaths();
  }

  /**
   * ADAPTIVE OPTIMIZATION
   */

  public rebalanceNetwork(): void {
    const failed = this.detectFailedNeurons();

    for (const failedNeuron of failed) {
      this.rewireAroundFailure(failedNeuron.id);
    }

    // Strengthen bypass connections
    this.strengthenHotPaths();
  }

  public getStatistics(): PlasticityStats {
    const allNeurons = this.circuit.getNeurons();
    let totalConnections = 0;

    for (const neuron of allNeurons) {
      totalConnections += this.circuit.getOutgoingConnections(neuron.id).length;
    }

    return {
      totalConnections,
      activePathways: this.pathwayUsage.size,
      prunedConnections: this.prunedCount,
      rewiresPerformed: this.rewireCount,
      failoversExecuted: this.failoverCount,
    };
  }

  public assessNetworkHealth(): NetworkHealth {
    const allNeurons = this.circuit.getNeurons();
    const activeNeurons = allNeurons.filter(
      (n) => n.state === 'active' || n.state === 'firing',
    ).length;

    let totalConnections = 0;
    let totalWeight = 0;

    for (const neuron of allNeurons) {
      const connections = this.circuit.getOutgoingConnections(neuron.id);
      totalConnections += connections.length;

      for (const conn of connections) {
        totalWeight += conn.weight;
      }
    }

    const averageWeight = totalConnections > 0 ? totalWeight / totalConnections : 0;

    // Calculate redundancy level
    const redundancyLevel = this.redundantPaths.size / Math.max(1, allNeurons.length);

    // Health score based on multiple factors
    const activeRatio = activeNeurons / Math.max(1, allNeurons.length);
    const weightQuality = averageWeight;
    const redundancyBonus = Math.min(1, redundancyLevel);

    const score = activeRatio * 0.5 + weightQuality * 0.3 + redundancyBonus * 0.2;

    return {
      score,
      activeNeurons,
      totalConnections,
      averageWeight,
      redundancyLevel,
    };
  }

  /**
   * COMPENSATORY MECHANISMS - Homologous activation
   */

  public markHomologous(leftId: string, rightId: string): void {
    this.homologousPairs.set(leftId, rightId);
    this.homologousPairs.set(rightId, leftId);
  }

  public compensateWithHomologous(failedNeuronId: string): void {
    const homologous = this.homologousPairs.get(failedNeuronId);

    if (homologous === undefined) {
      return;
    }

    // Find connections to the failed neuron
    const incoming = this.findIncomingConnections(failedNeuronId);

    // Redirect to homologous neuron
    for (const conn of incoming) {
      const target = this.circuit.getNeuron(homologous);

      if (target !== undefined) {
        this.circuit.connect(conn.source.id, target.id, {
          weight: conn.weight * 0.8, // Slightly reduced efficiency
          type: 'excitatory',
          speed: 'fast',
        });
      }
    }
  }

  public getCompensationTarget(neuronId: string): string | undefined {
    return this.homologousPairs.get(neuronId);
  }

  public detectInterference(neuronId: string): Interference | undefined {
    const homologous = this.homologousPairs.get(neuronId);

    if (homologous === undefined) {
      return undefined;
    }

    // Check if homologous neuron is over-active
    const neuron = this.circuit.getNeuron(neuronId);
    const homologousNeuron = this.circuit.getNeuron(homologous);

    if (neuron === undefined || homologousNeuron === undefined) {
      return undefined;
    }

    // Over-compensation detected if homologous is active and original is trying to recover
    if (
      neuron.state !== 'active' &&
      neuron.state !== 'firing' &&
      (homologousNeuron.state === 'active' || homologousNeuron.state === 'firing')
    ) {
      return {
        overActive: homologous,
        inhibiting: neuronId,
        strength: 0.8,
      };
    }

    return undefined;
  }

  /**
   * INTERNAL HELPER METHODS
   */

  private isPathActive(path: string[]): boolean {
    for (const neuronId of path) {
      const neuron = this.circuit.getNeuron(neuronId);

      if (neuron === undefined || (neuron.state !== 'active' && neuron.state !== 'firing')) {
        return false;
      }
    }

    return true;
  }

  private findAllPaths(sourceId: string, targetId: string, maxPaths: number): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();

    const dfs = (currentId: string, path: string[]): void => {
      if (currentId === targetId) {
        paths.push([...path]);
        return;
      }

      if (paths.length >= maxPaths) {
        return;
      }

      visited.add(currentId);
      const connections = this.circuit.getOutgoingConnections(currentId);

      for (const conn of connections) {
        // Skip inactive neurons
        if (
          !visited.has(conn.target.id) &&
          (conn.target.state === 'active' || conn.target.state === 'firing')
        ) {
          dfs(conn.target.id, [...path, conn.target.id]);
        }
      }

      visited.delete(currentId);
    };

    dfs(sourceId, [sourceId]);

    return paths;
  }

  private findIncomingConnections(neuronId: string): Connection[] {
    const allNeurons = this.circuit.getNeurons();
    const incoming: Connection[] = [];

    for (const neuron of allNeurons) {
      const connections = this.circuit.getOutgoingConnections(neuron.id);

      for (const conn of connections) {
        if (conn.target.id === neuronId) {
          incoming.push(conn);
        }
      }
    }

    return incoming;
  }
}
