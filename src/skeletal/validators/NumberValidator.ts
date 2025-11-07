/**
 * NumberValidator
 *
 * Validators for number values with various constraints
 */

import { Validator } from './Validator';
import type { ValidationError } from '../core/ValidationResult';
import { error } from '../core/ValidationResult';

/**
 * Base number validator - checks if value is a valid finite number
 */
export class NumberValidator extends Validator<number> {
  validate(value: unknown, field: string): ValidationError | null {
    if (typeof value !== 'number') {
      return error(field, `${field} must be a number`, 'INVALID_TYPE', value);
    }

    // Reject NaN and Infinity
    if (!Number.isFinite(value)) {
      return error(field, `${field} must be a finite number`, 'INVALID_TYPE', value);
    }

    return null;
  }
}

/**
 * MinValidator - ensures number is at least a minimum value
 */
class MinValidator extends NumberValidator {
  constructor(private readonly minimum: number) {
    super();
  }

  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a valid number
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const num = value as number;
    if (num < this.minimum) {
      return error(field, `${field} must be at least ${this.minimum}`, 'OUT_OF_RANGE', value);
    }

    return null;
  }
}

/**
 * MaxValidator - ensures number doesn't exceed a maximum value
 */
class MaxValidator extends NumberValidator {
  constructor(private readonly maximum: number) {
    super();
  }

  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a valid number
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const num = value as number;
    if (num > this.maximum) {
      return error(field, `${field} must not exceed ${this.maximum}`, 'OUT_OF_RANGE', value);
    }

    return null;
  }
}

/**
 * IntegerValidator - ensures number is an integer (no decimals)
 */
class IntegerValidator extends NumberValidator {
  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a valid number
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const num = value as number;
    if (!Number.isInteger(num)) {
      return error(field, `${field} must be an integer`, 'INVALID_FORMAT', value);
    }

    return null;
  }
}

/**
 * PositiveValidator - ensures number is greater than zero
 */
class PositiveValidator extends NumberValidator {
  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a valid number
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const num = value as number;
    if (num <= 0) {
      return error(field, `${field} must be a positive number`, 'OUT_OF_RANGE', value);
    }

    return null;
  }
}

/**
 * NegativeValidator - ensures number is less than zero
 */
class NegativeValidator extends NumberValidator {
  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a valid number
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const num = value as number;
    if (num >= 0) {
      return error(field, `${field} must be a negative number`, 'OUT_OF_RANGE', value);
    }

    return null;
  }
}

/**
 * RangeValidator - ensures number is within a range (inclusive)
 */
class RangeValidator extends NumberValidator {
  constructor(
    private readonly minimum: number,
    private readonly maximum: number,
  ) {
    super();
  }

  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a valid number
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const num = value as number;
    if (num < this.minimum) {
      return error(field, `${field} must be at least ${this.minimum}`, 'OUT_OF_RANGE', value);
    }

    if (num > this.maximum) {
      return error(field, `${field} must not exceed ${this.maximum}`, 'OUT_OF_RANGE', value);
    }

    return null;
  }
}

/**
 * Factory: Create a minimum value validator
 */
export function min(minimum: number): MinValidator {
  return new MinValidator(minimum);
}

/**
 * Factory: Create a maximum value validator
 */
export function max(maximum: number): MaxValidator {
  return new MaxValidator(maximum);
}

/**
 * Factory: Create an integer validator
 */
export function integer(): IntegerValidator {
  return new IntegerValidator();
}

/**
 * Factory: Create a positive number validator (> 0)
 */
export function positive(): PositiveValidator {
  return new PositiveValidator();
}

/**
 * Factory: Create a negative number validator (< 0)
 */
export function negative(): NegativeValidator {
  return new NegativeValidator();
}

/**
 * Factory: Create a range validator (min <= value <= max)
 */
export function range(minimum: number, maximum: number): RangeValidator {
  return new RangeValidator(minimum, maximum);
}
