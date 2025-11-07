/**
 * Synapse Skin Layer
 *
 * The Skin layer represents the organism's interface with the external world.
 * Built using 100% web standards: Custom Elements, Shadow DOM, HTML Templates.
 *
 * Biological metaphor:
 * - Skin = UI Layer (integumentary system)
 * - Receptors = Input components (detect external stimuli)
 * - Effectors = Action components (produce responses)
 * - Dermal Layer = Structural components (containers/layouts)
 * - Support Cells = State management and optimization
 */

// Base classes
export { SkinCell } from './cells/SkinCell';
export type { SkinCellState, SkinCellProps } from './cells/SkinCell';

// Receptors (Input components)
export { Receptor } from './receptors/Receptor';
export type { ReceptorState } from './receptors/Receptor';
export { TouchReceptor } from './receptors/TouchReceptor';
export type { TouchReceptorState } from './receptors/TouchReceptor';

// Re-export types from core
export type { Signal } from '../types';
