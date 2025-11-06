/**
 * Synapse Visual Cortex - UI Framework
 * Neural-inspired UI component system
 */

// Core types
export * from './types';

// Base visual neurons
export { VisualNeuron } from './VisualNeuron';
export type { VisualNeuronConfig } from './VisualNeuron';
export { SensoryNeuron } from './SensoryNeuron';
export { MotorNeuron } from './MotorNeuron';
export { InterneuronUI } from './InterneuronUI';

// Visual glial cells (UI support systems)
export * from './glial';

// Component library
export * from './components';
