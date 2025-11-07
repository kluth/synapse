/**
 * Bone
 *
 * Represents an immutable data model (like a database table or API resource).
 * Bones are the foundation of the Skeletal System - they define the structure
 * and validation rules for domain entities.
 */

import type { Schema } from './Schema';
import type { ValidationResult } from './ValidationResult';

/**
 * Bone - Immutable data model with schema validation
 *
 * @template T - The TypeScript type of the data model
 *
 * @example
 * ```typescript
 * const UserBone = new Bone('User', new Schema({
 *   name: new FieldSchema('string'),
 *   email: new FieldSchema('string').validate(email()),
 *   age: new FieldSchema('number').validate(min(18))
 * }));
 *
 * const result = UserBone.create({
 *   name: 'John',
 *   email: 'john@example.com',
 *   age: 25
 * });
 *
 * if (result.valid) {
 *   console.log('User created:', result.data);
 * }
 * ```
 */
export class Bone<T = Record<string, unknown>> {
  private readonly name: string;
  private readonly schema: Schema<T>;

  /**
   * Create a new Bone model
   *
   * @param name - The name of this data model (e.g., 'User', 'Post', 'Product')
   * @param schema - The schema that defines structure and validation rules
   */
  constructor(name: string, schema: Schema<T>) {
    this.name = name;
    this.schema = schema;
  }

  /**
   * Get the name of this bone
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the schema for this bone
   */
  getSchema(): Schema<T> {
    return this.schema;
  }

  /**
   * Create a new instance of this bone with validated data
   *
   * @param data - The raw data to validate and create
   * @returns ValidationResult with validated data or errors
   */
  create(data: unknown): ValidationResult<T> {
    return this.schema.validate(data);
  }

  /**
   * Validate data without creating an instance
   *
   * This is useful for checking if data would be valid before
   * attempting to create an instance.
   *
   * @param data - The data to validate
   * @returns ValidationResult indicating whether data is valid
   */
  validate(data: unknown): ValidationResult<T> {
    return this.schema.validate(data);
  }

  /**
   * Get a string representation of this bone
   */
  toString(): string {
    return `Bone<${this.name}>`;
  }
}
