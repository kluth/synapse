/**
 * FieldSchema
 *
 * Defines the structure and validation rules for a single field in a data model.
 * Supports primitive types, optional/required, nullable, defaults, and custom validators.
 */

import type { Validator } from '../validators/Validator';
import type { ValidationError } from './ValidationResult';
import { error } from './ValidationResult';

/**
 * Supported field types
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';

/**
 * FieldSchema - Immutable schema definition for a single field
 *
 * @template T - The TypeScript type of the field value
 */
export class FieldSchema<T = unknown> {
  constructor(
    public readonly type: FieldType,
    public readonly required: boolean = true,
    private readonly _nullable: boolean = false,
    public readonly defaultValue: T | undefined = undefined,
    public readonly validators: Validator<T>[] = [],
  ) {}

  /**
   * Check if this field is nullable
   */
  isNullable(): boolean {
    return this._nullable;
  }

  /**
   * Mark field as optional (not required)
   * Returns a new FieldSchema instance
   */
  optional(): FieldSchema<T | undefined> {
    return new FieldSchema<T | undefined>(
      this.type,
      false,
      this._nullable,
      this.defaultValue,
      this.validators as Validator<T | undefined>[],
    );
  }

  /**
   * Mark field as nullable (can accept null)
   * Returns a new FieldSchema instance
   */
  nullable(): FieldSchema<T | null> {
    return new FieldSchema<T | null>(
      this.type,
      this.required,
      true,
      this.defaultValue,
      this.validators as Validator<T | null>[],
    );
  }

  /**
   * Set default value for field
   * Returns a new FieldSchema instance
   */
  default(value: T): FieldSchema<T> {
    return new FieldSchema<T>(this.type, this.required, this._nullable, value, this.validators);
  }

  /**
   * Add a validator to the field
   * Returns a new FieldSchema instance
   */
  validate(validator: Validator<T>): FieldSchema<T> {
    return new FieldSchema<T>(this.type, this.required, this._nullable, this.defaultValue, [
      ...this.validators,
      validator,
    ]);
  }

  /**
   * Validate a value against this field schema
   *
   * @param value - The value to validate
   * @param field - The field path for error reporting
   * @returns ValidationError if invalid, null if valid
   */
  validateValue(value: unknown, field: string): ValidationError | null {
    // Check for undefined
    if (value === undefined) {
      if (this.required) {
        return error(field, `${field} is required`, 'REQUIRED', value);
      }
      return null; // Optional field, undefined is ok
    }

    // Check for null
    if (value === null) {
      if (!this._nullable) {
        return error(field, `${field} cannot be null`, 'INVALID_TYPE', value);
      }
      return null; // Nullable field, null is ok
    }

    // Type validation
    const typeError = this.validateType(value, field);
    if (typeError !== null) {
      return typeError;
    }

    // Run custom validators
    for (const validator of this.validators) {
      const validationError = validator.validate(value, field);
      if (validationError !== null) {
        return validationError;
      }
    }

    return null;
  }

  /**
   * Validate that value matches the expected type
   */
  private validateType(value: unknown, field: string): ValidationError | null {
    switch (this.type) {
      case 'string':
        if (typeof value !== 'string') {
          return error(field, `${field} must be a string`, 'INVALID_TYPE', value);
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          return error(field, `${field} must be a number`, 'INVALID_TYPE', value);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return error(field, `${field} must be a boolean`, 'INVALID_TYPE', value);
        }
        break;

      case 'date':
        if (!(value instanceof Date)) {
          return error(field, `${field} must be a Date`, 'INVALID_TYPE', value);
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return error(field, `${field} must be an object`, 'INVALID_TYPE', value);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return error(field, `${field} must be an array`, 'INVALID_TYPE', value);
        }
        break;
    }

    return null;
  }

  /**
   * Get the value or return the default if undefined
   *
   * @param value - The value to check
   * @returns The value or default value
   */
  getValueOrDefault(value: unknown): T | undefined {
    if (value === undefined) {
      return this.defaultValue;
    }
    return value as T;
  }
}
