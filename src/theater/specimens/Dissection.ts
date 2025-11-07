/**
 * Dissection - Component structure explorer
 *
 * Dissection provides tools for examining component props, structure,
 * and behavior. It's similar to Storybook's Controls/Args but with
 * more powerful inspection capabilities.
 */

/**
 * Prop type
 */
export type PropType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'function'
  | 'enum'
  | 'date'
  | 'custom';

/**
 * Prop definition
 */
export interface PropDefinition {
  /**
   * Prop name
   */
  name: string;

  /**
   * Prop type
   */
  type: PropType;

  /**
   * Description
   */
  description?: string;

  /**
   * Default value
   */
  defaultValue?: unknown;

  /**
   * Is required
   */
  required?: boolean;

  /**
   * Possible values (for enum type)
   */
  options?: unknown[];

  /**
   * Custom type name
   */
  customType?: string;

  /**
   * Validation function
   */
  validate?: (value: unknown) => boolean;

  /**
   * Control type for UI
   */
  control?: 'text' | 'number' | 'boolean' | 'select' | 'radio' | 'range' | 'color' | 'date';

  /**
   * Control config
   */
  controlConfig?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

/**
 * Component structure
 */
export interface ComponentStructure {
  /**
   * Component name
   */
  name: string;

  /**
   * Props definitions
   */
  props: Map<string, PropDefinition>;

  /**
   * Component methods
   */
  methods: Map<string, string>;

  /**
   * Events emitted
   */
  events: Map<string, string>;

  /**
   * Child components
   */
  children?: ComponentStructure[];
}

/**
 * Dissection - Component explorer
 */
export class Dissection {
  private structure: ComponentStructure;
  private propValues: Map<string, unknown> = new Map();
  private propChangeListeners: Set<(prop: string, value: unknown) => void> = new Set();

  constructor(structure: ComponentStructure) {
    this.structure = structure;
    this.initializeDefaultValues();
  }

  /**
   * Initialize prop default values
   */
  private initializeDefaultValues(): void {
    for (const [name, def] of this.structure.props) {
      if (def.defaultValue !== undefined) {
        this.propValues.set(name, def.defaultValue);
      }
    }
  }

  /**
   * Get component structure
   */
  public getStructure(): ComponentStructure {
    return { ...this.structure };
  }

  /**
   * Get prop definition
   */
  public getPropDefinition(name: string): PropDefinition | undefined {
    return this.structure.props.get(name);
  }

  /**
   * Get all prop definitions
   */
  public getAllProps(): Map<string, PropDefinition> {
    return new Map(this.structure.props);
  }

  /**
   * Set prop value
   */
  public setPropValue(name: string, value: unknown): void {
    const def = this.structure.props.get(name);
    if (def === undefined) {
      throw new Error(`Prop not found: ${name}`);
    }

    // Validate value
    if (def.validate !== undefined && !def.validate(value)) {
      throw new Error(`Invalid value for prop: ${name}`);
    }

    this.propValues.set(name, value);
    this.notifyPropChange(name, value);
  }

  /**
   * Get prop value
   */
  public getPropValue(name: string): unknown {
    return this.propValues.get(name);
  }

  /**
   * Get all prop values
   */
  public getAllPropValues(): Record<string, unknown> {
    return Object.fromEntries(this.propValues);
  }

  /**
   * Reset prop to default value
   */
  public resetProp(name: string): void {
    const def = this.structure.props.get(name);
    if (def === undefined) {
      throw new Error(`Prop not found: ${name}`);
    }

    if (def.defaultValue !== undefined) {
      this.propValues.set(name, def.defaultValue);
      this.notifyPropChange(name, def.defaultValue);
    } else {
      this.propValues.delete(name);
      this.notifyPropChange(name, undefined);
    }
  }

  /**
   * Reset all props to defaults
   */
  public resetAllProps(): void {
    this.propValues.clear();
    this.initializeDefaultValues();

    for (const [name, value] of this.propValues) {
      this.notifyPropChange(name, value);
    }
  }

  /**
   * Add prop change listener
   */
  public onPropChange(listener: (prop: string, value: unknown) => void): () => void {
    this.propChangeListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.propChangeListeners.delete(listener);
    };
  }

  /**
   * Notify prop change listeners
   */
  private notifyPropChange(prop: string, value: unknown): void {
    for (const listener of this.propChangeListeners) {
      listener(prop, value);
    }
  }

  /**
   * Get required props
   */
  public getRequiredProps(): Map<string, PropDefinition> {
    const required = new Map<string, PropDefinition>();

    for (const [name, def] of this.structure.props) {
      if (def.required === true) {
        required.set(name, def);
      }
    }

    return required;
  }

  /**
   * Get optional props
   */
  public getOptionalProps(): Map<string, PropDefinition> {
    const optional = new Map<string, PropDefinition>();

    for (const [name, def] of this.structure.props) {
      if (def.required !== true) {
        optional.set(name, def);
      }
    }

    return optional;
  }

  /**
   * Get props by type
   */
  public getPropsByType(type: PropType): Map<string, PropDefinition> {
    const filtered = new Map<string, PropDefinition>();

    for (const [name, def] of this.structure.props) {
      if (def.type === type) {
        filtered.set(name, def);
      }
    }

    return filtered;
  }

  /**
   * Validate all prop values
   */
  public validateAllProps(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [name, def] of this.structure.props) {
      // Check required props
      if (def.required === true && !this.propValues.has(name)) {
        errors.push(`Required prop missing: ${name}`);
        continue;
      }

      // Validate value if present
      const value = this.propValues.get(name);
      if (value !== undefined && def.validate !== undefined && !def.validate(value)) {
        errors.push(`Invalid value for prop: ${name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get component methods
   */
  public getMethods(): Map<string, string> {
    return new Map(this.structure.methods);
  }

  /**
   * Get component events
   */
  public getEvents(): Map<string, string> {
    return new Map(this.structure.events);
  }

  /**
   * Export dissection data
   */
  public export(): {
    structure: ComponentStructure;
    currentValues: Record<string, unknown>;
    validation: { valid: boolean; errors: string[] };
  } {
    return {
      structure: { ...this.structure },
      currentValues: this.getAllPropValues(),
      validation: this.validateAllProps(),
    };
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalProps: number;
    requiredProps: number;
    optionalProps: number;
    methodsCount: number;
    eventsCount: number;
  } {
    return {
      totalProps: this.structure.props.size,
      requiredProps: this.getRequiredProps().size,
      optionalProps: this.getOptionalProps().size,
      methodsCount: this.structure.methods.size,
      eventsCount: this.structure.events.size,
    };
  }
}

/**
 * Create dissection from TypeScript interface (helper for future auto-generation)
 */
export function createDissection(name: string, props: PropDefinition[]): Dissection {
  const structure: ComponentStructure = {
    name,
    props: new Map(props.map((p) => [p.name, p])),
    methods: new Map(),
    events: new Map(),
  };

  return new Dissection(structure);
}

/**
 * Dissection builder for fluent API
 */
export class DissectionBuilder {
  private name: string = '';
  private props: Map<string, PropDefinition> = new Map();
  private methods: Map<string, string> = new Map();
  private events: Map<string, string> = new Map();

  public withName(name: string): this {
    this.name = name;
    return this;
  }

  public addProp(prop: PropDefinition): this {
    this.props.set(prop.name, prop);
    return this;
  }

  public addMethod(name: string, description: string): this {
    this.methods.set(name, description);
    return this;
  }

  public addEvent(name: string, description: string): this {
    this.events.set(name, description);
    return this;
  }

  public build(): Dissection {
    if (this.name.length === 0) {
      throw new Error('Component name is required');
    }

    const structure: ComponentStructure = {
      name: this.name,
      props: this.props,
      methods: this.methods,
      events: this.events,
    };

    return new Dissection(structure);
  }
}
