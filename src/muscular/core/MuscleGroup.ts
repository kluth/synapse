import { Muscle } from './Muscle';

/**
 * Conditional branch configuration
 */
export interface ConditionalBranch<TInput = any, TOutput = any> {
  condition: (input: TInput) => boolean;
  muscle: Muscle<TInput, TOutput> | MuscleGroup<TInput, TOutput>;
}

/**
 * MuscleGroup - Composition of multiple muscles
 *
 * Supports:
 * - Sequential execution (pipeline)
 * - Parallel execution (concurrent)
 * - Conditional execution (branching)
 * - Transaction support (all-or-nothing)
 * - Compensation patterns (saga pattern)
 */
export class MuscleGroup<TInput = any, TOutput = any> {
  private readonly muscles: Array<Muscle<any, any> | MuscleGroup<any, any>>;
  private readonly executionStrategy: 'sequential' | 'parallel' | 'conditional' | 'transaction' | 'saga';
  private readonly options: any;

  private constructor(
    muscles: Array<Muscle<any, any> | MuscleGroup<any, any>>,
    strategy: 'sequential' | 'parallel' | 'conditional' | 'transaction' | 'saga',
    options: any = {}
  ) {
    this.muscles = muscles;
    this.executionStrategy = strategy;
    this.options = options;
  }

  /**
   * Create a sequential pipeline of muscles
   */
  public static sequential<TInput = any, TOutput = any>(
    muscles: Array<Muscle<any, any> | MuscleGroup<any, any>>
  ): MuscleGroup<TInput, TOutput> {
    return new MuscleGroup(muscles, 'sequential');
  }

  /**
   * Create a parallel group of muscles
   */
  public static parallel<TInput = any>(
    muscles: Array<Muscle<TInput, any> | MuscleGroup<TInput, any>>
  ): MuscleGroup<TInput, any[]> {
    return new MuscleGroup(muscles, 'parallel');
  }

  /**
   * Create a conditional muscle (if-then-else)
   */
  public static conditional<TInput = any, TOutput = any>(
    condition: (input: TInput) => boolean,
    trueMuscle: Muscle<TInput, TOutput> | MuscleGroup<TInput, TOutput>,
    falseMuscle: Muscle<TInput, TOutput> | MuscleGroup<TInput, TOutput>
  ): MuscleGroup<TInput, TOutput> {
    return new MuscleGroup(
      [trueMuscle, falseMuscle],
      'conditional',
      { condition, branches: [{ condition, muscle: trueMuscle }, { condition: () => true, muscle: falseMuscle }] }
    );
  }

  /**
   * Create a switch statement with multiple branches
   */
  public static switch<TInput = any, TOutput = any>(
    branches: ConditionalBranch<TInput, TOutput>[]
  ): MuscleGroup<TInput, TOutput> {
    return new MuscleGroup(
      branches.map(b => b.muscle),
      'conditional',
      { branches }
    );
  }

  /**
   * Create a transactional group with rollback support
   */
  public static transaction<TInput = any, TOutput = any>(
    muscles: Array<Muscle<any, any> | MuscleGroup<any, any>>
  ): MuscleGroup<TInput, TOutput> {
    return new MuscleGroup(muscles, 'transaction');
  }

  /**
   * Create a saga with compensation functions
   */
  public static saga<TInput = any, TOutput = any>(
    muscles: Array<Muscle<any, any> | MuscleGroup<any, any>>
  ): MuscleGroup<TInput, TOutput> {
    return new MuscleGroup(muscles, 'saga');
  }

  /**
   * Execute the muscle group
   */
  public async execute(input?: TInput): Promise<TOutput> {
    switch (this.executionStrategy) {
      case 'sequential':
        return this.executeSequential(input) as Promise<TOutput>;
      case 'parallel':
        return this.executeParallel(input) as Promise<TOutput>;
      case 'conditional':
        return this.executeConditional(input) as Promise<TOutput>;
      case 'transaction':
        return this.executeTransaction(input) as Promise<TOutput>;
      case 'saga':
        return this.executeSaga(input) as Promise<TOutput>;
      default:
        throw new Error(`Unknown execution strategy: ${this.executionStrategy}`);
    }
  }

  /**
   * Execute muscles sequentially (pipeline)
   */
  private async executeSequential(input: any): Promise<any> {
    if (this.muscles.length === 0) {
      return input;
    }

    let result = input;
    for (const muscle of this.muscles) {
      result = await this.executeMuscle(muscle, result);
    }
    return result;
  }

  /**
   * Execute muscles in parallel
   */
  private async executeParallel(input: any): Promise<any[]> {
    const promises = this.muscles.map(muscle => this.executeMuscle(muscle, input));
    return Promise.all(promises);
  }

  /**
   * Execute muscles conditionally
   */
  private async executeConditional(input: any): Promise<any> {
    const branches = this.options.branches as ConditionalBranch[];

    for (const branch of branches) {
      if (branch.condition(input)) {
        return this.executeMuscle(branch.muscle, input);
      }
    }

    throw new Error('No matching condition found');
  }

  /**
   * Execute muscles as a transaction with rollback
   */
  private async executeTransaction(input: any): Promise<any> {
    const executed: Array<Muscle<any, any> | MuscleGroup<any, any>> = [];
    let result = input;

    try {
      for (const muscle of this.muscles) {
        result = await this.executeMuscle(muscle, result);
        executed.push(muscle);
      }
      return result;
    } catch (error) {
      // Rollback in reverse order
      for (let i = executed.length - 1; i >= 0; i--) {
        const muscle = executed[i];
        if (this.isMuscle(muscle)) {
          const rollback = muscle.metadata.rollback;
          if (rollback && typeof rollback === 'function') {
            try {
              await rollback();
            } catch (rollbackError) {
              console.error('Rollback failed:', rollbackError);
            }
          }
        }
      }
      throw error;
    }
  }

  /**
   * Execute muscles as a saga with compensation
   */
  private async executeSaga(input: any): Promise<any> {
    const executed: Array<Muscle<any, any> | MuscleGroup<any, any>> = [];
    let result = input;

    try {
      for (const muscle of this.muscles) {
        result = await this.executeMuscle(muscle, result);
        executed.push(muscle);
      }
      return result;
    } catch (error) {
      // Run compensations in reverse order
      for (let i = executed.length - 1; i >= 0; i--) {
        const muscle = executed[i];
        if (this.isMuscle(muscle)) {
          const compensate = muscle.metadata.compensate;
          if (compensate && typeof compensate === 'function') {
            try {
              await compensate();
            } catch (compensationError) {
              console.error('Compensation failed:', compensationError);
            }
          }
        }
      }
      throw error;
    }
  }

  /**
   * Execute a single muscle or muscle group
   */
  private async executeMuscle(
    muscle: Muscle<any, any> | MuscleGroup<any, any>,
    input: any
  ): Promise<any> {
    if (this.isMuscle(muscle)) {
      // It's a Muscle
      return muscle.executeAsync(input);
    } else {
      // It's a MuscleGroup
      return muscle.execute(input);
    }
  }

  /**
   * Type guard to check if something is a Muscle
   */
  private isMuscle(obj: any): obj is Muscle<any, any> {
    return obj instanceof Muscle;
  }
}
