import { validateName, validateGlialType, isPascalCase } from './validation';

describe('Validation Utils', () => {
  describe('isPascalCase', () => {
    it('should return true for valid PascalCase names', () => {
      expect(isPascalCase('UserService')).toBe(true);
      expect(isPascalCase('MyNeuron')).toBe(true);
      expect(isPascalCase('A')).toBe(true);
    });

    it('should return false for invalid PascalCase names', () => {
      expect(isPascalCase('userService')).toBe(false);
      expect(isPascalCase('user-service')).toBe(false);
      expect(isPascalCase('user_service')).toBe(false);
      expect(isPascalCase('123User')).toBe(false);
      expect(isPascalCase('')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should not throw for valid names', () => {
      expect(() => validateName('UserService')).not.toThrow();
      expect(() => validateName('MyComponent')).not.toThrow();
    });

    it('should throw for empty names', () => {
      expect(() => validateName('', 'Component')).toThrow('Component name is required');
    });

    it('should throw for non-PascalCase names', () => {
      expect(() => validateName('userService', 'Component')).toThrow(
        'Component name must be in PascalCase',
      );
    });
  });

  describe('validateGlialType', () => {
    it('should return true for valid glial types', () => {
      expect(validateGlialType('astrocyte')).toBe(true);
      expect(validateGlialType('oligodendrocyte')).toBe(true);
      expect(validateGlialType('microglia')).toBe(true);
      expect(validateGlialType('ependymal')).toBe(true);
    });

    it('should return false for invalid glial types', () => {
      expect(validateGlialType('invalid')).toBe(false);
      expect(validateGlialType('neuron')).toBe(false);
      expect(validateGlialType('')).toBe(false);
    });
  });
});
