/**
 * Schema Tests
 *
 * TDD: Write tests first, then implement Schema
 */

import { Schema } from '../core/Schema';
import { FieldSchema } from '../core/FieldSchema';
import { minLength, email } from '../validators/StringValidator';
import { min, max, integer } from '../validators/NumberValidator';

describe('Schema', () => {
  describe('Basic Schema Definition', () => {
    it('should create a schema with fields', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      expect(schema).toBeDefined();
    });

    it('should validate valid data', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      const result = schema.validate({
        name: 'John',
        age: 30,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should reject invalid data', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      const result = schema.validate({
        name: 'John',
        age: 'thirty',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('age');
    });
  });

  describe('Required Fields', () => {
    it('should enforce required fields', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number'),
      });

      const result = schema.validate({
        name: 'John',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('age');
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should allow optional fields to be missing', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number').optional(),
      });

      const result = schema.validate({
        name: 'John',
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John' });
    });
  });

  describe('Default Values', () => {
    it('should apply default values', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        role: new FieldSchema('string').default('user'),
      });

      const result = schema.validate({
        name: 'John',
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John', role: 'user' });
    });

    it('should use provided value over default', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        role: new FieldSchema('string').default('user'),
      });

      const result = schema.validate({
        name: 'John',
        role: 'admin',
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John', role: 'admin' });
    });
  });

  describe('Field Validators', () => {
    it('should run field validators', () => {
      const schema = new Schema({
        email: new FieldSchema('string').validate(email()),
        age: new FieldSchema('number').validate(min(0)).validate(max(150)),
      });

      const result = schema.validate({
        email: 'invalid-email',
        age: 25,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
    });

    it('should collect multiple validation errors', () => {
      const schema = new Schema({
        email: new FieldSchema('string').validate(email()),
        age: new FieldSchema('number').validate(min(0)).validate(max(150)),
      });

      const result = schema.validate({
        email: 'invalid',
        age: 200,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.map((e) => e.field)).toContain('email');
      expect(result.errors.map((e) => e.field)).toContain('age');
    });
  });

  describe('Complex Schemas', () => {
    it('should validate user registration schema', () => {
      const userSchema = new Schema({
        username: new FieldSchema('string').validate(minLength(3)),
        email: new FieldSchema('string').validate(email()),
        age: new FieldSchema('number').validate(min(18)).validate(max(120)).validate(integer()),
        role: new FieldSchema('string').optional().default('user'),
      });

      const result = userSchema.validate({
        username: 'johndoe',
        email: 'john@example.com',
        age: 25,
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        username: 'johndoe',
        email: 'john@example.com',
        age: 25,
        role: 'user',
      });
    });

    it('should reject invalid user registration', () => {
      const userSchema = new Schema({
        username: new FieldSchema('string').validate(minLength(3)),
        email: new FieldSchema('string').validate(email()),
        age: new FieldSchema('number').validate(min(18)).validate(max(120)).validate(integer()),
      });

      const result = userSchema.validate({
        username: 'ab',
        email: 'invalid-email',
        age: 15,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('Unknown Fields', () => {
    it('should ignore unknown fields by default', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
      });

      const result = schema.validate({
        name: 'John',
        unknownField: 'value',
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John' });
    });

    it('should optionally include unknown fields in output', () => {
      const schema = new Schema(
        {
          name: new FieldSchema('string'),
        },
        { strict: false },
      );

      const result = schema.validate({
        name: 'John',
        extra: 'value',
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John', extra: 'value' });
    });

    it('should optionally reject unknown fields', () => {
      const schema = new Schema(
        {
          name: new FieldSchema('string'),
        },
        { strict: true, allowUnknown: false },
      );

      const result = schema.validate({
        name: 'John',
        extra: 'value',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('extra');
      expect(result.errors[0].code).toBe('UNKNOWN_FIELD');
    });
  });

  describe('Null and Undefined Handling', () => {
    it('should handle nullable fields', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
        nickname: new FieldSchema('string').nullable().optional(),
      });

      const result = schema.validate({
        name: 'John',
        nickname: null,
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John', nickname: null });
    });
  });

  describe('Empty Data', () => {
    it('should handle empty object', () => {
      const schema = new Schema({
        name: new FieldSchema('string'),
      });

      const result = schema.validate({});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should validate empty object with all optional fields', () => {
      const schema = new Schema({
        name: new FieldSchema('string').optional(),
        age: new FieldSchema('number').optional(),
      });

      const result = schema.validate({});

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({});
    });
  });
});
