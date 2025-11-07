/**
 * Validator Base Class
 *
 * Abstract base class for all validators in the Skeletal System.
 * Validators check if data meets specific constraints.
 */

import type { ValidationError } from '../core/ValidationResult';

/**
 * Abstract base class for validators
 *
 * @template T - The type of value this validator validates
 */
export abstract class Validator<T = unknown> {
  /**
   * Validate a value
   *
   * @param value - The value to validate
   * @param field - The field path for error reporting
   * @returns ValidationError if invalid, null if valid
   */
  abstract validate(value: unknown, field: string): ValidationError | null;

  /**
   * Combine this validator with another using AND logic
   *
   * Both validators must pass for the combined validator to pass.
   * Returns the first error encountered.
   *
   * @param other - Another validator to combine with
   * @returns A new combined validator
   */
  and<U>(other: Validator<U>): Validator<T & U> {
    return new AndValidator(this, other);
  }
}

/**
 * Combines two validators with AND logic
 */
class AndValidator<T, U> extends Validator<T & U> {
  constructor(
    private readonly validator1: Validator<T>,
    private readonly validator2: Validator<U>,
  ) {
    super();
  }

  validate(value: unknown, field: string): ValidationError | null {
    // Run first validator
    const error1 = this.validator1.validate(value, field);
    if (error1 !== null) {
      return error1;
    }

    // Run second validator
    const error2 = this.validator2.validate(value, field);
    if (error2 !== null) {
      return error2;
    }

    return null;
  }
}
