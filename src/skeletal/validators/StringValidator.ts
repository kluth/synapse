/**
 * StringValidator
 *
 * Validators for string values with various constraints
 */

import { Validator } from './Validator';
import type { ValidationError } from '../core/ValidationResult';
import { error } from '../core/ValidationResult';

/**
 * Base string validator - checks if value is a string
 */
export class StringValidator extends Validator<string> {
  validate(value: unknown, field: string): ValidationError | null {
    if (typeof value !== 'string') {
      return error(field, `${field} must be a string`, 'INVALID_TYPE', value);
    }

    return null;
  }
}

/**
 * MinLengthValidator - ensures string has minimum length
 */
class MinLengthValidator extends StringValidator {
  constructor(private readonly min: number) {
    super();
  }

  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a string
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const str = value as string;
    if (str.length < this.min) {
      return error(
        field,
        `${field} must be at least ${this.min} characters long`,
        'TOO_SHORT',
        value,
      );
    }

    return null;
  }
}

/**
 * MaxLengthValidator - ensures string doesn't exceed maximum length
 */
class MaxLengthValidator extends StringValidator {
  constructor(private readonly max: number) {
    super();
  }

  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a string
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const str = value as string;
    if (str.length > this.max) {
      return error(field, `${field} must not exceed ${this.max} characters`, 'TOO_LONG', value);
    }

    return null;
  }
}

/**
 * PatternValidator - ensures string matches a regex pattern
 */
class PatternValidator extends StringValidator {
  constructor(private readonly regex: RegExp) {
    super();
  }

  override validate(value: unknown, field: string): ValidationError | null {
    // First check if it's a string
    const baseError = super.validate(value, field);
    if (baseError !== null) {
      return baseError;
    }

    const str = value as string;
    if (!this.regex.test(str)) {
      return error(field, `${field} must match the required format`, 'INVALID_FORMAT', value);
    }

    return null;
  }
}

/**
 * Factory: Create a minimum length validator
 */
export function minLength(min: number): MinLengthValidator {
  return new MinLengthValidator(min);
}

/**
 * Factory: Create a maximum length validator
 */
export function maxLength(max: number): MaxLengthValidator {
  return new MaxLengthValidator(max);
}

/**
 * Factory: Create a pattern validator
 */
export function pattern(regex: RegExp): PatternValidator {
  return new PatternValidator(regex);
}

/**
 * Factory: Create an email validator
 *
 * Uses a reasonable email regex that catches most invalid emails
 * while not being overly strict
 */
export function email(): PatternValidator {
  // More strict email regex that requires proper domain with TLD
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  return new PatternValidator(emailRegex);
}

/**
 * Factory: Create a URL validator
 *
 * Validates http:// and https:// URLs
 */
export function url(): PatternValidator {
  const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

  return new PatternValidator(urlRegex);
}

/**
 * Factory: Create a UUID validator
 *
 * Validates UUID v4 format
 */
export function uuid(): PatternValidator {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return new PatternValidator(uuidRegex);
}
