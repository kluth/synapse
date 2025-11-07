/**
 * ValidationResult
 *
 * Represents the result of validating data against a schema.
 * Immutable and type-safe.
 */

/**
 * Standard validation error codes
 */
export type ValidationErrorCode =
  | 'REQUIRED' // Field is required but missing
  | 'INVALID_TYPE' // Wrong data type
  | 'INVALID_FORMAT' // Format doesn't match (e.g., email, URL)
  | 'OUT_OF_RANGE' // Number out of min/max range
  | 'TOO_SHORT' // String/array too short
  | 'TOO_LONG' // String/array too long
  | 'DUPLICATE' // Value already exists (uniqueness violation)
  | 'UNKNOWN_FIELD' // Field not defined in schema
  | 'CUSTOM'; // Custom validation failure

/**
 * Validation error details
 */
export interface ValidationError {
  /**
   * Field path (supports nested paths like "address.zipCode")
   */
  field: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Standard error code for programmatic handling
   */
  code: ValidationErrorCode;

  /**
   * The invalid value (optional, for debugging)
   */
  value?: unknown;
}

/**
 * Result of validation
 *
 * If valid=true, data contains the validated & typed data
 * If valid=false, data is undefined and errors contains validation errors
 */
export interface ValidationResult<T> {
  /**
   * Whether validation succeeded
   */
  valid: boolean;

  /**
   * Validated data (only present if valid=true)
   */
  data: T | undefined;

  /**
   * Validation errors (empty if valid=true)
   */
  errors: ValidationError[];
}

/**
 * Helper to create a successful validation result
 */
export function success<T>(data: T): ValidationResult<T> {
  return {
    valid: true,
    data,
    errors: [],
  };
}

/**
 * Helper to create a failed validation result
 */
export function failure<T>(errors: ValidationError[]): ValidationResult<T> {
  return {
    valid: false,
    data: undefined,
    errors,
  };
}

/**
 * Helper to create a single error
 */
export function error(
  field: string,
  message: string,
  code: ValidationErrorCode,
  value?: unknown,
): ValidationError {
  return {
    field,
    message,
    code,
    value,
  };
}
