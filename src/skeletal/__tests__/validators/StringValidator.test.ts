/**
 * StringValidator Tests
 *
 * TDD: Write tests first, then implement StringValidator
 */

import {
  StringValidator,
  minLength,
  maxLength,
  pattern,
  email,
  url,
  uuid,
} from '../../validators/StringValidator';

describe('StringValidator', () => {
  describe('Type Checking', () => {
    it('should validate string type', () => {
      const validator = new StringValidator();
      const error = validator.validate('hello', 'name');

      expect(error).toBeNull();
    });

    it('should reject non-string types', () => {
      const validator = new StringValidator();

      expect(validator.validate(123, 'name')).not.toBeNull();
      expect(validator.validate(true, 'name')).not.toBeNull();
      expect(validator.validate({}, 'name')).not.toBeNull();
      expect(validator.validate([], 'name')).not.toBeNull();
      expect(validator.validate(null, 'name')).not.toBeNull();
    });

    it('should return INVALID_TYPE error code', () => {
      const validator = new StringValidator();
      const error = validator.validate(123, 'name');

      expect(error?.code).toBe('INVALID_TYPE');
    });
  });

  describe('minLength', () => {
    it('should validate minimum length', () => {
      const validator = minLength(5);
      const error = validator.validate('hello', 'name');

      expect(error).toBeNull();
    });

    it('should reject strings that are too short', () => {
      const validator = minLength(5);
      const error = validator.validate('hi', 'name');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('TOO_SHORT');
      expect(error?.message).toContain('5');
    });

    it('should work with exact minimum length', () => {
      const validator = minLength(3);
      const error = validator.validate('abc', 'name');

      expect(error).toBeNull();
    });
  });

  describe('maxLength', () => {
    it('should validate maximum length', () => {
      const validator = maxLength(10);
      const error = validator.validate('hello', 'name');

      expect(error).toBeNull();
    });

    it('should reject strings that are too long', () => {
      const validator = maxLength(5);
      const error = validator.validate('hello world', 'name');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('TOO_LONG');
      expect(error?.message).toContain('5');
    });

    it('should work with exact maximum length', () => {
      const validator = maxLength(5);
      const error = validator.validate('hello', 'name');

      expect(error).toBeNull();
    });
  });

  describe('pattern', () => {
    it('should validate regex patterns', () => {
      const validator = pattern(/^[a-z]+$/);
      const error = validator.validate('hello', 'name');

      expect(error).toBeNull();
    });

    it('should reject non-matching patterns', () => {
      const validator = pattern(/^[a-z]+$/);
      const error = validator.validate('Hello123', 'name');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('INVALID_FORMAT');
    });

    it('should work with complex patterns', () => {
      const validator = pattern(/^\d{3}-\d{3}-\d{4}$/); // Phone format
      expect(validator.validate('123-456-7890', 'phone')).toBeNull();
      expect(validator.validate('1234567890', 'phone')).not.toBeNull();
    });
  });

  describe('email', () => {
    it('should validate correct email addresses', () => {
      const validator = email();
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        expect(validator.validate(email, 'email')).toBeNull();
      });
    });

    it('should reject invalid email addresses', () => {
      const validator = email();
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach((email) => {
        const error = validator.validate(email, 'email');
        expect(error).not.toBeNull();
        expect(error?.code).toBe('INVALID_FORMAT');
      });
    });
  });

  describe('url', () => {
    it('should validate correct URLs', () => {
      const validator = url();
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://subdomain.example.com',
      ];

      validUrls.forEach((url) => {
        expect(validator.validate(url, 'website')).toBeNull();
      });
    });

    it('should reject invalid URLs', () => {
      const validator = url();
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'ftp://example.com', // Only http/https by default
        '//example.com',
      ];

      invalidUrls.forEach((url) => {
        const error = validator.validate(url, 'website');
        expect(error).not.toBeNull();
        expect(error?.code).toBe('INVALID_FORMAT');
      });
    });
  });

  describe('uuid', () => {
    it('should validate correct UUIDs', () => {
      const validator = uuid();
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ];

      validUuids.forEach((id) => {
        expect(validator.validate(id, 'id')).toBeNull();
      });
    });

    it('should reject invalid UUIDs', () => {
      const validator = uuid();
      const invalidUuids = [
        'not-a-uuid',
        '123',
        '123e4567-e89b-12d3-a456-42661417400', // Too short
        '123e4567-e89b-12d3-a456-4266141740000', // Too long
        '123e4567-e89b-12d3-a456-426614174g00', // Invalid char
      ];

      invalidUuids.forEach((id) => {
        const error = validator.validate(id, 'id');
        expect(error).not.toBeNull();
        expect(error?.code).toBe('INVALID_FORMAT');
      });
    });
  });

  describe('Validator Composition', () => {
    it('should combine multiple string validators', () => {
      const validator = minLength(3)
        .and(maxLength(10))
        .and(pattern(/^[a-z]+$/));

      expect(validator.validate('hello', 'name')).toBeNull();
      expect(validator.validate('hi', 'name')).not.toBeNull(); // Too short
      expect(validator.validate('verylongname', 'name')).not.toBeNull(); // Too long
      expect(validator.validate('Hello', 'name')).not.toBeNull(); // Invalid pattern
    });

    it('should combine with email validator', () => {
      const validator = minLength(10).and(email());

      expect(validator.validate('user@example.com', 'email')).toBeNull();
      expect(validator.validate('u@e.co', 'email')).not.toBeNull(); // Too short (6 chars)
      expect(validator.validate('not-an-email', 'email')).not.toBeNull(); // Invalid format
    });
  });
});
