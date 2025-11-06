/**
 * Synapse Framework - Neural-Inspired TypeScript Framework
 *
 * A TypeScript full-stack framework modeled after the nervous system,
 * bringing biological intelligence to distributed software architecture.
 *
 * @packageDocumentation
 */

// Core exports
export { NeuralNode, Connection } from './core';

// Neuron types
export { CorticalNeuron, ReflexNeuron } from './neurons';

// Glial cells (support systems)
export { Astrocyte, Oligodendrocyte, Microglia, Ependymal } from './glial';

// Communication
export { EventBus } from './communication';

// Network management
export { NeuralCircuit } from './network';

// Neuroplasticity (self-healing and optimization)
export { Neuroplasticity } from './plasticity';

// Interfaces
export type { INeuralNode, IConnection } from './interfaces';

// Types
export type {
  NeuronType,
  ConnectionType,
  TransmissionSpeed,
  Protocol,
  NodeState,
  HealthStatus,
  Signal,
  Event,
  Input,
  Output,
  Decision,
} from './types';

// Schemas
export { SignalSchema, EventSchema } from './types';

/**
 * Framework version
 */
export const VERSION = '0.1.0';

/**
 * Framework metadata
 */
export const FRAMEWORK = {
  name: 'Synapse',
  version: VERSION,
  description: 'Neural-inspired TypeScript framework for distributed systems',
} as const;
