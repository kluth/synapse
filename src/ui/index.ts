/**
 * Synapse Visual Cortex - UI Framework
 * Neural-inspired UI component system
 */

// Core types
export * from './types';

// Base visual neurons
export { SkinCell } from './SkinCell';
export type { SkinCellConfig } from './SkinCell';
export { Receptor } from './Receptor';
export { Effector } from './Effector';
export { DermalLayer } from './DermalLayer';

// Visual glial cells (UI support systems)
export * from './glial';

// Component library
export * from './components';
