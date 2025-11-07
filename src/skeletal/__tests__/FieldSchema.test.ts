/**
 * FieldSchema Tests
 *
 * TDD: Write tests first, then implement FieldSchema
 */

import { FieldSchema } from '../core/FieldSchema';
import { minLength, email } from '../validators/StringValidator';
import { min, max, integer } from '../validators/NumberValidator';

describe('FieldSchema', () => {
  describe('Basic Field Definition', () => {
    it('should create a field schema with type', () => {
      const field = new FieldSchema('string');

      expect(field.type).toBe('string');
    });

    it('should support all primitive types', () => {
      const types = ['string', 'number', 'boolean', 'date', 'object', 'array'] as const;

      types.forEach((type) => {
        const field = new FieldSchema(type);
        expect(field.type).toBe(type);
      });
    });

    it('should be required by default', () => {
      const field = new FieldSchema('string');
      expect(field.required).toBe(true);
    });

    it('should not be nullable by default', () => {
      const field = new FieldSchema('string');
      expect(field.isNullable()).toBe(false);
    });

    it('should have no default value by default', () => {
      const field = new FieldSchema('string');
      expect(field.defaultValue).toBeUndefined();
    });
  });

  describe('Field Configuration', () => {
    it('should allow marking field as optional', () => {
      const field = new FieldSchema('string').optional();

      expect(field.required).toBe(false);
    });

    it('should allow marking field as nullable', () => {
      const field = new FieldSchema('string').nullable();

      expect(field.isNullable()).toBe(true);
    });

    it('should allow setting default value', () => {
      const field = new FieldSchema('string').default('hello');

      expect(field.defaultValue).toBe('hello');
    });

    it('should allow chaining configuration methods', () => {
      const field = new FieldSchema('string').optional().nullable().default('test');

      expect(field.required).toBe(false);
      expect(field.isNullable()).toBe(true);
      expect(field.defaultValue).toBe('test');
    });
  });

  describe('Validators', () => {
    it('should allow adding validators', () => {
      const field = new FieldSchema('string').validate(minLength(5));

      expect(field.validators).toHaveLength(1);
    });

    it('should allow adding multiple validators', () => {
      const field = new FieldSchema('string').validate(minLength(5)).validate(email());

      expect(field.validators).toHaveLength(2);
    });

    it('should run validators during validation', () => {
      const field = new FieldSchema('string').validate(minLength(5));

      const result = field.validateValue('hello', 'name');
      expect(result).toBeNull();

      const error = field.validateValue('hi', 'name');
      expect(error).not.toBeNull();
      expect(error?.code).toBe('TOO_SHORT');
    });

    it('should run all validators in order', () => {
      const field = new FieldSchema('string').validate(minLength(10)).validate(email());

      // Should fail minLength first
      const error = field.validateValue('test', 'email');
      expect(error?.code).toBe('TOO_SHORT');
    });
  });

  describe('Type Validation', () => {
    it('should validate string type', () => {
      const field = new FieldSchema('string');

      expect(field.validateValue('hello', 'name')).toBeNull();
      expect(field.validateValue(123, 'name')).not.toBeNull();
    });

    it('should validate number type', () => {
      const field = new FieldSchema('number');

      expect(field.validateValue(123, 'age')).toBeNull();
      expect(field.validateValue('123', 'age')).not.toBeNull();
    });

    it('should validate boolean type', () => {
      const field = new FieldSchema('boolean');

      expect(field.validateValue(true, 'active')).toBeNull();
      expect(field.validateValue(false, 'active')).toBeNull();
      expect(field.validateValue('true', 'active')).not.toBeNull();
    });

    it('should validate date type', () => {
      const field = new FieldSchema('date');

      expect(field.validateValue(new Date(), 'createdAt')).toBeNull();
      expect(field.validateValue('2024-01-01', 'createdAt')).not.toBeNull();
    });
  });

  describe('Required Fields', () => {
    it('should reject undefined for required fields', () => {
      const field = new FieldSchema('string');

      const error = field.validateValue(undefined, 'name');
      expect(error).not.toBeNull();
      expect(error?.code).toBe('REQUIRED');
    });

    it('should allow undefined for optional fields', () => {
      const field = new FieldSchema('string').optional();

      expect(field.validateValue(undefined, 'name')).toBeNull();
    });

    it('should use default value when undefined', () => {
      const field = new FieldSchema('string').default('default');

      const value = field.getValueOrDefault(undefined);
      expect(value).toBe('default');
    });

    it('should use actual value when provided', () => {
      const field = new FieldSchema('string').default('default');

      const value = field.getValueOrDefault('actual');
      expect(value).toBe('actual');
    });
  });

  describe('Nullable Fields', () => {
    it('should reject null for non-nullable fields', () => {
      const field = new FieldSchema('string');

      const error = field.validateValue(null, 'name');
      expect(error).not.toBeNull();
      expect(error?.code).toBe('INVALID_TYPE');
    });

    it('should allow null for nullable fields', () => {
      const field = new FieldSchema('string').nullable();

      expect(field.validateValue(null, 'name')).toBeNull();
    });
  });

  describe('Number Field with Validators', () => {
    it('should validate number with range', () => {
      const field = new FieldSchema('number')
        .validate(min(0))
        .validate(max(150))
        .validate(integer());

      expect(field.validateValue(50, 'age')).toBeNull();
      expect(field.validateValue(-1, 'age')).not.toBeNull();
      expect(field.validateValue(151, 'age')).not.toBeNull();
      expect(field.validateValue(50.5, 'age')).not.toBeNull();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle optional nullable field with default', () => {
      const field = new FieldSchema('string').optional().nullable().default('default');

      expect(field.validateValue(undefined, 'name')).toBeNull();
      expect(field.validateValue(null, 'name')).toBeNull();
      expect(field.validateValue('value', 'name')).toBeNull();
      expect(field.getValueOrDefault(undefined)).toBe('default');
    });

    it('should handle email field', () => {
      const field = new FieldSchema('string').validate(email()).validate(minLength(6));

      expect(field.validateValue('user@example.com', 'email')).toBeNull();
      expect(field.validateValue('invalid', 'email')).not.toBeNull();
      expect(field.validateValue('a@b.c', 'email')).not.toBeNull(); // Too short (5 chars, need 6)
    });
  });
});
