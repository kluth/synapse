/**
 * Skeletal System
 *
 * The foundation of the Synapse framework - provides immutable data models,
 * schemas, and validation. Like bones in the human body, the Skeletal System
 * provides structure and support for the entire application.
 *
 * @example
 * ```typescript
 * import { Bone, Schema, FieldSchema, minLength, email } from '@synapse-framework/core/skeletal';
 *
 * // Define a User model
 * const UserBone = new Bone('User', new Schema({
 *   username: new FieldSchema('string').validate(minLength(3)),
 *   email: new FieldSchema('string').validate(email()),
 *   age: new FieldSchema('number').validate(min(18))
 * }));
 *
 * // Create a user instance
 * const result = UserBone.create({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   age: 25
 * });
 *
 * if (result.valid) {
 *   console.log('User created:', result.data);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */

// Core types and classes
export { Bone } from './core/Bone';
export { Schema } from './core/Schema';
export type { SchemaOptions } from './core/Schema';
export { FieldSchema } from './core/FieldSchema';
export type { FieldType } from './core/FieldSchema';

// Validation results
export type {
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
} from './core/ValidationResult';
export { success, failure, error } from './core/ValidationResult';

// Base validator
export { Validator } from './validators/Validator';

// String validators
export {
  StringValidator,
  minLength,
  maxLength,
  pattern,
  email,
  url,
  uuid,
} from './validators/StringValidator';

// Number validators
export {
  NumberValidator,
  min,
  max,
  integer,
  positive,
  negative,
  range,
} from './validators/NumberValidator';
