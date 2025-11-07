/**
 * Muscular System - Business Logic Layer
 *
 * The Muscular System provides the business logic layer with pure functions and operations.
 *
 * ## Core Components
 * - **Muscle**: Base class for wrapping pure functions with validation, memoization, and error handling
 * - **MuscleGroup**: Composition of muscles (sequential, parallel, conditional, transaction, saga)
 * - **MuscleMemory**: Advanced caching system with TTL, LRU, and invalidation strategies
 *
 * ## Built-in Muscles
 * - **ComputeMuscle**: Mathematical operations (add, subtract, multiply, etc.)
 * - **TransformMuscle**: Data transformations (toString, parseJSON, split, etc.)
 * - **AggregateMuscle**: Data aggregation (sum, average, min, max, etc.)
 * - **FilterMuscle**: Data filtering (greaterThan, lessThan, truthy, unique, etc.)
 * - **SortMuscle**: Data sorting (ascending, descending, by comparator, etc.)
 * - **MapMuscle**: Collection mapping (map, property extraction, withIndex, etc.)
 * - **ReduceMuscle**: Collection reduction (reduce, groupBy, etc.)
 *
 * @example
 * ```typescript
 * import { Muscle, MuscleGroup, ComputeMuscle } from '@synapse-framework/core/muscular';
 *
 * // Create a simple muscle
 * const double = new Muscle('double', (x: number) => x * 2);
 *
 * // Use built-in muscles
 * const add = ComputeMuscle.add();
 * console.log(add.execute(5, 3)); // 8
 *
 * // Create a pipeline
 * const pipeline = MuscleGroup.sequential([
 *   add,
 *   double,
 *   ComputeMuscle.subtract()
 * ]);
 * ```
 */

// Core
export { Muscle } from './core/Muscle';
export type { MuscleOptions, MuscleMetadata, RetryPolicy, ExecutionContext } from './core/Muscle';

export { MuscleGroup } from './core/MuscleGroup';
export type { ConditionalBranch } from './core/MuscleGroup';

export { MuscleMemory } from './core/MuscleMemory';
export type { MuscleMemoryOptions, SetOptions, CacheStats } from './core/MuscleMemory';

// Built-in Muscles
export {
  ComputeMuscle,
  TransformMuscle,
  AggregateMuscle,
  FilterMuscle,
  SortMuscle,
  MapMuscle,
  ReduceMuscle,
} from './built-in';
