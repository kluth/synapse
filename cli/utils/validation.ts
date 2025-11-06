/**
 * Check if a string is in PascalCase format
 */
export function isPascalCase(name: string): boolean {
  if (!name || name.length === 0) {
    return false;
  }

  // PascalCase: starts with uppercase letter, only contains letters and numbers
  const pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/;
  return pascalCaseRegex.test(name);
}

/**
 * Validate component name (must be in PascalCase)
 */
export function validateName(name: string, componentType = 'Component'): void {
  if (!name || name.trim().length === 0) {
    throw new Error(`${componentType} name is required`);
  }

  if (!isPascalCase(name)) {
    throw new Error(`${componentType} name must be in PascalCase (e.g., UserService, MyComponent)`);
  }
}

/**
 * Valid glial cell types
 */
export const GLIAL_TYPES = ['astrocyte', 'oligodendrocyte', 'microglia', 'ependymal'] as const;

export type GlialType = (typeof GLIAL_TYPES)[number];

/**
 * Validate glial cell type
 */
export function validateGlialType(type: string): type is GlialType {
  return GLIAL_TYPES.includes(type as GlialType);
}
