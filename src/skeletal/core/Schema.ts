/**
 * Schema
 *
 * Defines the structure and validation rules for complete data objects.
 * Composes multiple FieldSchemas to validate complex data structures.
 */

import type { FieldSchema } from './FieldSchema';
import type { ValidationResult, ValidationError } from './ValidationResult';
import { error } from './ValidationResult';

/**
 * Schema options for controlling validation behavior
 */
export interface SchemaOptions {
  /**
   * If true, only include defined fields in output (default: true)
   * If false, include unknown fields in output
   */
  strict?: boolean;

  /**
   * If false, reject unknown fields with errors (default: true)
   * Only applies when strict=true
   */
  allowUnknown?: boolean;
}

/**
 * Schema - Validates complete data objects against field definitions
 *
 * @template T - The TypeScript type of the validated data
 */
export class Schema<T = Record<string, unknown>> {
  private readonly fields: Record<string, FieldSchema>;
  private readonly options: Required<SchemaOptions>;

  constructor(fields: Record<string, FieldSchema>, options: SchemaOptions = {}) {
    this.fields = fields;
    this.options = {
      strict: options.strict ?? true,
      allowUnknown: options.allowUnknown ?? true,
    };
  }

  /**
   * Validate data against this schema
   *
   * @param data - The data to validate
   * @returns ValidationResult with validated data or errors
   */
  validate(data: unknown): ValidationResult<T> {
    // Type check - must be an object
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return {
        valid: false,
        data: undefined,
        errors: [error('$root', 'Data must be an object', 'INVALID_TYPE', data)],
      };
    }

    const inputData = data as Record<string, unknown>;
    const errors: ValidationError[] = [];
    const validatedData: Record<string, unknown> = {};

    // Validate defined fields
    for (const [fieldName, fieldSchema] of Object.entries(this.fields)) {
      const value = inputData[fieldName];

      // Check if field exists in input
      if (value === undefined) {
        // Apply default value if available
        const defaultValue = fieldSchema.getValueOrDefault(undefined);
        if (defaultValue !== undefined) {
          validatedData[fieldName] = defaultValue;
          continue;
        }
      }

      // Validate field
      const fieldError = fieldSchema.validateValue(value, fieldName);
      if (fieldError !== null) {
        errors.push(fieldError);
      } else if (value !== undefined) {
        // Only include the field if it's not undefined (optional fields)
        validatedData[fieldName] = value;
      } else {
        // Field is optional and undefined, check if it has a default
        const defaultValue = fieldSchema.getValueOrDefault(undefined);
        if (defaultValue !== undefined) {
          validatedData[fieldName] = defaultValue;
        }
      }
    }

    // Handle unknown fields
    if (!this.options.strict) {
      // Include unknown fields in output
      for (const [key, value] of Object.entries(inputData)) {
        if (!(key in this.fields)) {
          validatedData[key] = value;
        }
      }
    } else if (!this.options.allowUnknown) {
      // Reject unknown fields
      for (const key of Object.keys(inputData)) {
        if (!(key in this.fields)) {
          errors.push(error(key, `Unknown field: ${key}`, 'UNKNOWN_FIELD', inputData[key]));
        }
      }
    }

    // Return result
    if (errors.length > 0) {
      return {
        valid: false,
        data: undefined,
        errors,
      };
    }

    return {
      valid: true,
      data: validatedData as T,
      errors: [],
    };
  }

  /**
   * Get the field schemas defined in this schema
   */
  getFields(): Record<string, FieldSchema> {
    return { ...this.fields };
  }

  /**
   * Get a specific field schema by name
   */
  getField(name: string): FieldSchema | undefined {
    return this.fields[name];
  }
}
