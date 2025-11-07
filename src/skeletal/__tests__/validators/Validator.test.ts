/**
 * Validator Base Class Tests
 *
 * TDD: Write tests first, then implement Validator
 */

import { Validator } from '../../validators/Validator';
import type { ValidationError } from '../../core/ValidationResult';

// Test validator implementation
class TestValidator extends Validator<string> {
  validate(value: unknown, field: string): ValidationError | null {
    if (typeof value !== 'string') {
      return {
        field,
        message: 'Value must be a string',
        code: 'INVALID_TYPE',
        value,
      };
    }

    if (value.length < 3) {
      return {
        field,
        message: 'Value must be at least 3 characters',
        code: 'TOO_SHORT',
        value,
      };
    }

    return null;
  }
}

class AlwaysValidValidator extends Validator<unknown> {
  validate(_value: unknown, _field: string): ValidationError | null {
    return null;
  }
}

class AlwaysInvalidValidator extends Validator<unknown> {
  validate(value: unknown, field: string): ValidationError | null {
    return {
      field,
      message: 'Always invalid',
      code: 'CUSTOM',
      value,
    };
  }
}

describe('Validator', () => {
  describe('Base Functionality', () => {
    it('should create a validator instance', () => {
      const validator = new TestValidator();
      expect(validator).toBeInstanceOf(Validator);
    });

    it('should validate correct values', () => {
      const validator = new TestValidator();
      const error = validator.validate('hello', 'name');

      expect(error).toBeNull();
    });

    it('should return error for invalid values', () => {
      const validator = new TestValidator();
      const error = validator.validate(123, 'name');

      expect(error).not.toBeNull();
      expect(error?.field).toBe('name');
      expect(error?.code).toBe('INVALID_TYPE');
      expect(error?.value).toBe(123);
    });

    it('should return error with correct field path', () => {
      const validator = new TestValidator();
      const error = validator.validate('ab', 'user.name');

      expect(error).not.toBeNull();
      expect(error?.field).toBe('user.name');
      expect(error?.code).toBe('TOO_SHORT');
    });
  });

  describe('Validator Composition', () => {
    it('should allow combining validators with and()', () => {
      const validator1 = new AlwaysValidValidator();
      const validator2 = new TestValidator();

      const combined = validator1.and(validator2);
      const error = combined.validate('ab', 'name');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('TOO_SHORT');
    });

    it('should pass if all validators pass', () => {
      const validator1 = new AlwaysValidValidator();
      const validator2 = new AlwaysValidValidator();

      const combined = validator1.and(validator2);
      const error = combined.validate('test', 'name');

      expect(error).toBeNull();
    });

    it('should return first error in chain', () => {
      const validator1 = new AlwaysInvalidValidator();
      const validator2 = new TestValidator();

      const combined = validator1.and(validator2);
      const error = combined.validate('test', 'name');

      expect(error).not.toBeNull();
      expect(error?.message).toBe('Always invalid');
    });
  });

  describe('Validator Chaining', () => {
    it('should allow chaining multiple validators', () => {
      const v1 = new AlwaysValidValidator();
      const v2 = new AlwaysValidValidator();
      const v3 = new TestValidator();

      const chained = v1.and(v2).and(v3);
      const error = chained.validate('ab', 'name');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('TOO_SHORT');
    });
  });

  describe('Error Details', () => {
    it('should include value in error for debugging', () => {
      const validator = new TestValidator();
      const testValue = 'ab';
      const error = validator.validate(testValue, 'name');

      expect(error?.value).toBe(testValue);
    });

    it('should include clear error messages', () => {
      const validator = new TestValidator();
      const error = validator.validate(123, 'name');

      expect(error?.message).toBe('Value must be a string');
      expect(error?.message.length).toBeGreaterThan(0);
    });
  });
});
