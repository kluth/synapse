/**
 * ValidationResult Tests
 *
 * TDD: Write tests first, then implement ValidationResult
 */

import type { ValidationResult, ValidationError } from '../core/ValidationResult';

describe('ValidationResult', () => {
  describe('Success Result', () => {
    it('should represent a valid result', () => {
      const result: ValidationResult<{ name: string }> = {
        valid: true,
        data: { name: 'Alice' },
        errors: [],
      };

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'Alice' });
      expect(result.errors).toHaveLength(0);
    });

    it('should have undefined data when valid is false', () => {
      const result: ValidationResult<unknown> = {
        valid: false,
        data: undefined,
        errors: [
          {
            field: 'email',
            message: 'Invalid email format',
            code: 'INVALID_FORMAT',
          },
        ],
      };

      expect(result.valid).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('ValidationError', () => {
    it('should have required fields', () => {
      const error: ValidationError = {
        field: 'age',
        message: 'Age must be a positive number',
        code: 'INVALID_TYPE',
      };

      expect(error.field).toBe('age');
      expect(error.message).toBe('Age must be a positive number');
      expect(error.code).toBe('INVALID_TYPE');
    });

    it('should support optional value field', () => {
      const error: ValidationError = {
        field: 'email',
        message: 'Email already exists',
        code: 'DUPLICATE',
        value: 'alice@example.com',
      };

      expect(error.value).toBe('alice@example.com');
    });

    it('should support nested field paths', () => {
      const error: ValidationError = {
        field: 'address.zipCode',
        message: 'Invalid zip code',
        code: 'INVALID_FORMAT',
      };

      expect(error.field).toBe('address.zipCode');
    });
  });

  describe('Error Codes', () => {
    it('should support standard error codes', () => {
      const codes = [
        'REQUIRED',
        'INVALID_TYPE',
        'INVALID_FORMAT',
        'OUT_OF_RANGE',
        'TOO_SHORT',
        'TOO_LONG',
        'DUPLICATE',
        'CUSTOM',
      ];

      codes.forEach((code) => {
        const error: ValidationError = {
          field: 'test',
          message: 'Test error',
          code: code as ValidationError['code'],
        };

        expect(error.code).toBe(code);
      });
    });
  });
});
