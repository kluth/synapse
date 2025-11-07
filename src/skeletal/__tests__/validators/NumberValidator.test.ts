/**
 * NumberValidator Tests
 *
 * TDD: Write tests first, then implement NumberValidator
 */

import {
  NumberValidator,
  min,
  max,
  integer,
  positive,
  negative,
  range,
} from '../../validators/NumberValidator';

describe('NumberValidator', () => {
  describe('Type Checking', () => {
    it('should validate number type', () => {
      const validator = new NumberValidator();
      expect(validator.validate(123, 'age')).toBeNull();
      expect(validator.validate(0, 'age')).toBeNull();
      expect(validator.validate(-123, 'age')).toBeNull();
      expect(validator.validate(123.45, 'price')).toBeNull();
    });

    it('should reject non-number types', () => {
      const validator = new NumberValidator();

      expect(validator.validate('123', 'age')).not.toBeNull();
      expect(validator.validate(true, 'age')).not.toBeNull();
      expect(validator.validate({}, 'age')).not.toBeNull();
      expect(validator.validate([], 'age')).not.toBeNull();
      expect(validator.validate(null, 'age')).not.toBeNull();
    });

    it('should reject NaN', () => {
      const validator = new NumberValidator();
      const error = validator.validate(NaN, 'age');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('INVALID_TYPE');
    });

    it('should reject Infinity', () => {
      const validator = new NumberValidator();

      expect(validator.validate(Infinity, 'age')).not.toBeNull();
      expect(validator.validate(-Infinity, 'age')).not.toBeNull();
    });

    it('should return INVALID_TYPE error code', () => {
      const validator = new NumberValidator();
      const error = validator.validate('abc', 'age');

      expect(error?.code).toBe('INVALID_TYPE');
    });
  });

  describe('min', () => {
    it('should validate minimum value', () => {
      const validator = min(0);

      expect(validator.validate(0, 'age')).toBeNull();
      expect(validator.validate(10, 'age')).toBeNull();
      expect(validator.validate(100, 'age')).toBeNull();
    });

    it('should reject values below minimum', () => {
      const validator = min(0);
      const error = validator.validate(-1, 'age');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('OUT_OF_RANGE');
      expect(error?.message).toContain('0');
    });

    it('should work with exact minimum value', () => {
      const validator = min(18);
      expect(validator.validate(18, 'age')).toBeNull();
    });

    it('should work with negative minimums', () => {
      const validator = min(-100);

      expect(validator.validate(-100, 'temp')).toBeNull();
      expect(validator.validate(-50, 'temp')).toBeNull();
      expect(validator.validate(-101, 'temp')).not.toBeNull();
    });
  });

  describe('max', () => {
    it('should validate maximum value', () => {
      const validator = max(100);

      expect(validator.validate(100, 'age')).toBeNull();
      expect(validator.validate(50, 'age')).toBeNull();
      expect(validator.validate(0, 'age')).toBeNull();
    });

    it('should reject values above maximum', () => {
      const validator = max(100);
      const error = validator.validate(101, 'age');

      expect(error).not.toBeNull();
      expect(error?.code).toBe('OUT_OF_RANGE');
      expect(error?.message).toContain('100');
    });

    it('should work with exact maximum value', () => {
      const validator = max(150);
      expect(validator.validate(150, 'age')).toBeNull();
    });
  });

  describe('integer', () => {
    it('should validate integer values', () => {
      const validator = integer();

      expect(validator.validate(0, 'count')).toBeNull();
      expect(validator.validate(1, 'count')).toBeNull();
      expect(validator.validate(-5, 'count')).toBeNull();
      expect(validator.validate(1000, 'count')).toBeNull();
    });

    it('should reject decimal values', () => {
      const validator = integer();

      expect(validator.validate(1.5, 'count')).not.toBeNull();
      expect(validator.validate(0.1, 'count')).not.toBeNull();
      expect(validator.validate(-3.14, 'count')).not.toBeNull();
    });

    it('should return INVALID_FORMAT error code', () => {
      const validator = integer();
      const error = validator.validate(1.5, 'count');

      expect(error?.code).toBe('INVALID_FORMAT');
    });
  });

  describe('positive', () => {
    it('should validate positive numbers', () => {
      const validator = positive();

      expect(validator.validate(0.1, 'price')).toBeNull();
      expect(validator.validate(1, 'price')).toBeNull();
      expect(validator.validate(1000, 'price')).toBeNull();
    });

    it('should reject zero and negative numbers', () => {
      const validator = positive();

      expect(validator.validate(0, 'price')).not.toBeNull();
      expect(validator.validate(-1, 'price')).not.toBeNull();
      expect(validator.validate(-100, 'price')).not.toBeNull();
    });

    it('should return OUT_OF_RANGE error code', () => {
      const validator = positive();
      const error = validator.validate(-1, 'price');

      expect(error?.code).toBe('OUT_OF_RANGE');
    });
  });

  describe('negative', () => {
    it('should validate negative numbers', () => {
      const validator = negative();

      expect(validator.validate(-0.1, 'temp')).toBeNull();
      expect(validator.validate(-1, 'temp')).toBeNull();
      expect(validator.validate(-1000, 'temp')).toBeNull();
    });

    it('should reject zero and positive numbers', () => {
      const validator = negative();

      expect(validator.validate(0, 'temp')).not.toBeNull();
      expect(validator.validate(1, 'temp')).not.toBeNull();
      expect(validator.validate(100, 'temp')).not.toBeNull();
    });
  });

  describe('range', () => {
    it('should validate values within range', () => {
      const validator = range(0, 100);

      expect(validator.validate(0, 'percentage')).toBeNull();
      expect(validator.validate(50, 'percentage')).toBeNull();
      expect(validator.validate(100, 'percentage')).toBeNull();
    });

    it('should reject values outside range', () => {
      const validator = range(0, 100);

      expect(validator.validate(-1, 'percentage')).not.toBeNull();
      expect(validator.validate(101, 'percentage')).not.toBeNull();
    });

    it('should work with negative ranges', () => {
      const validator = range(-100, 100);

      expect(validator.validate(-100, 'temp')).toBeNull();
      expect(validator.validate(0, 'temp')).toBeNull();
      expect(validator.validate(100, 'temp')).toBeNull();
      expect(validator.validate(-101, 'temp')).not.toBeNull();
      expect(validator.validate(101, 'temp')).not.toBeNull();
    });
  });

  describe('Validator Composition', () => {
    it('should combine multiple number validators', () => {
      const validator = min(0).and(max(150)).and(integer());

      expect(validator.validate(50, 'age')).toBeNull();
      expect(validator.validate(-1, 'age')).not.toBeNull(); // Below min
      expect(validator.validate(151, 'age')).not.toBeNull(); // Above max
      expect(validator.validate(50.5, 'age')).not.toBeNull(); // Not integer
    });

    it('should combine positive with integer', () => {
      const validator = positive().and(integer());

      expect(validator.validate(1, 'count')).toBeNull();
      expect(validator.validate(100, 'count')).toBeNull();
      expect(validator.validate(0, 'count')).not.toBeNull(); // Not positive
      expect(validator.validate(-1, 'count')).not.toBeNull(); // Not positive
      expect(validator.validate(1.5, 'count')).not.toBeNull(); // Not integer
    });

    it('should use range as shorthand for min+max', () => {
      const rangeValidator = range(0, 100);
      const minMaxValidator = min(0).and(max(100));

      expect(rangeValidator.validate(50, 'val')).toBeNull();
      expect(minMaxValidator.validate(50, 'val')).toBeNull();

      expect(rangeValidator.validate(-1, 'val')).not.toBeNull();
      expect(minMaxValidator.validate(-1, 'val')).not.toBeNull();

      expect(rangeValidator.validate(101, 'val')).not.toBeNull();
      expect(minMaxValidator.validate(101, 'val')).not.toBeNull();
    });
  });
});
