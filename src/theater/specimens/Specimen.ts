/**
 * Specimen - Component showcase wrapper
 *
 * A Specimen wraps a component for observation and documentation in the
 * Anatomy Theater. It provides metadata, variations, and rendering context.
 */

import type { VisualNeuron } from '../../ui/VisualNeuron';

/**
 * Specimen metadata
 */
export interface SpecimenMetadata {
  /**
   * Unique specimen identifier
   */
  id: string;

  /**
   * Display name
   */
  name: string;

  /**
   * Component category
   */
  category: string;

  /**
   * Tags for searchability
   */
  tags: string[];

  /**
   * Description of the component
   */
  description?: string;

  /**
   * Creation timestamp
   */
  createdAt?: Date;

  /**
   * Last update timestamp
   */
  updatedAt?: Date;

  /**
   * Component author
   */
  author?: string;

  /**
   * Version
   */
  version?: string;

  /**
   * Additional custom metadata
   */
  custom?: Record<string, unknown>;
}

/**
 * Specimen rendering context
 */
export interface SpecimenContext {
  /**
   * Props to pass to component
   */
  props?: Record<string, unknown>;

  /**
   * Initial state
   */
  state?: Record<string, unknown>;

  /**
   * Wrapper element styles
   */
  wrapperStyles?: Record<string, string>;

  /**
   * Global styles for the specimen
   */
  globalStyles?: string;

  /**
   * Background color
   */
  backgroundColor?: string;

  /**
   * Padding
   */
  padding?: number;

  /**
   * Enable interactions
   * @default true
   */
  interactive?: boolean;

  /**
   * Viewport size
   */
  viewport?: { width: number; height: number };
}

/**
 * Specimen render function
 */
export type SpecimenRenderFn<T extends object = object> = (
  context: SpecimenContext,
) => VisualNeuron<T> | HTMLElement;

/**
 * Specimen - Component showcase wrapper
 */
export class Specimen<T extends object = object> {
  public readonly metadata: SpecimenMetadata;
  private renderFn: SpecimenRenderFn<T>;
  private defaultContext: SpecimenContext;
  private variations: Map<string, SpecimenContext> = new Map();

  constructor(
    metadata: SpecimenMetadata,
    renderFn: SpecimenRenderFn<T>,
    defaultContext: SpecimenContext = {},
  ) {
    this.metadata = metadata;
    this.renderFn = renderFn;
    this.defaultContext = {
      interactive: true,
      backgroundColor: '#ffffff',
      padding: 16,
      ...defaultContext,
    };
  }

  /**
   * Render the specimen
   */
  public render(context: SpecimenContext = {}): VisualNeuron<T> | HTMLElement {
    const mergedContext: SpecimenContext = {
      ...this.defaultContext,
      ...context,
      props: {
        ...this.defaultContext.props,
        ...context.props,
      },
      state: {
        ...this.defaultContext.state,
        ...context.state,
      },
    };

    return this.renderFn(mergedContext);
  }

  /**
   * Add a variation (e.g., "primary", "secondary", "disabled")
   */
  public addVariation(name: string, context: SpecimenContext): this {
    this.variations.set(name, context);
    return this;
  }

  /**
   * Remove a variation
   */
  public removeVariation(name: string): boolean {
    return this.variations.delete(name);
  }

  /**
   * Get a variation
   */
  public getVariation(name: string): SpecimenContext | undefined {
    return this.variations.get(name);
  }

  /**
   * Get all variations
   */
  public getVariations(): Map<string, SpecimenContext> {
    return new Map(this.variations);
  }

  /**
   * Check if variation exists
   */
  public hasVariation(name: string): boolean {
    return this.variations.has(name);
  }

  /**
   * Render a specific variation
   */
  public renderVariation(name: string): VisualNeuron<T> | HTMLElement {
    const variation = this.variations.get(name);
    if (variation === undefined) {
      throw new Error(`Variation not found: ${name}`);
    }

    return this.render(variation);
  }

  /**
   * Render all variations
   */
  public renderAllVariations(): Map<string, VisualNeuron<T> | HTMLElement> {
    const rendered = new Map<string, VisualNeuron<T> | HTMLElement>();

    for (const [name, context] of this.variations) {
      rendered.set(name, this.render(context));
    }

    return rendered;
  }

  /**
   * Update metadata
   */
  public updateMetadata(updates: Partial<SpecimenMetadata>): void {
    Object.assign(this.metadata, updates);
    if (updates.updatedAt === undefined) {
      this.metadata.updatedAt = new Date();
    }
  }

  /**
   * Update default context
   */
  public updateDefaultContext(updates: Partial<SpecimenContext>): void {
    this.defaultContext = {
      ...this.defaultContext,
      ...updates,
      props: {
        ...this.defaultContext.props,
        ...updates.props,
      },
      state: {
        ...this.defaultContext.state,
        ...updates.state,
      },
    };
  }

  /**
   * Clone this specimen with new metadata
   */
  public clone(metadata: Partial<SpecimenMetadata>): Specimen<T> {
    const cloned = new Specimen<T>({ ...this.metadata, ...metadata }, this.renderFn, {
      ...this.defaultContext,
    });

    // Copy variations
    for (const [name, context] of this.variations) {
      cloned.addVariation(name, { ...context });
    }

    return cloned;
  }

  /**
   * Export specimen definition
   */
  public export(): {
    metadata: SpecimenMetadata;
    defaultContext: SpecimenContext;
    variations: Record<string, SpecimenContext>;
  } {
    return {
      metadata: { ...this.metadata },
      defaultContext: { ...this.defaultContext },
      variations: Object.fromEntries(this.variations),
    };
  }

  /**
   * Get specimen statistics
   */
  public getStats(): {
    variationCount: number;
    hasDescription: boolean;
    tagCount: number;
  } {
    return {
      variationCount: this.variations.size,
      hasDescription: this.metadata.description !== undefined,
      tagCount: this.metadata.tags.length,
    };
  }
}
