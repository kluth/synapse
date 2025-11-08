/**
 * Atlas - Documentation Hub
 *
 * The Atlas serves as the central documentation system for The Anatomy Theater,
 * aggregating component documentation, generating API docs from TypeScript,
 * and providing search and navigation capabilities.
 *
 * Medical Metaphor: An anatomical atlas is a comprehensive reference guide
 * containing detailed illustrations and descriptions of body structures.
 */

import { EventEmitter } from 'events';
import type { VisualNeuron } from '../../ui/VisualNeuron';
import type { ComponentProps } from '../../ui/types';

/**
 * Documentation entry for a component
 */
export interface ComponentDocumentation {
  /** Unique component identifier */
  id: string;

  /** Component name */
  name: string;

  /** Component description */
  description: string;

  /** Component category (e.g., 'ui', 'glial', 'respiratory') */
  category: string;

  /** Component tags for filtering */
  tags: string[];

  /** Props documentation */
  props: PropDocumentation[];

  /** State documentation */
  state: StateDocumentation[];

  /** Signal documentation */
  signals: SignalDocumentation[];

  /** Usage examples */
  examples: CodeExample[];

  /** Related components */
  related: string[];

  /** Source file path */
  source: string;

  /** When documented */
  timestamp: number;
}

/**
 * Prop documentation
 */
export interface PropDocumentation {
  /** Prop name */
  name: string;

  /** TypeScript type */
  type: string;

  /** Description */
  description: string;

  /** Whether required */
  required: boolean;

  /** Default value */
  defaultValue?: unknown;

  /** Example values */
  examples?: unknown[];
}

/**
 * State documentation
 */
export interface StateDocumentation {
  /** State key */
  key: string;

  /** TypeScript type */
  type: string;

  /** Description */
  description: string;

  /** Initial value */
  initialValue?: unknown;
}

/**
 * Signal documentation
 */
export interface SignalDocumentation {
  /** Signal type */
  type: string;

  /** Description */
  description: string;

  /** Signal data structure */
  dataType?: string;

  /** When signal is emitted */
  trigger: string;
}

/**
 * Code example
 */
export interface CodeExample {
  /** Example title */
  title: string;

  /** Example description */
  description: string;

  /** Code snippet */
  code: string;

  /** Programming language */
  language: string;
}

/**
 * Search query for documentation
 */
export interface DocumentationQuery {
  /** Text search */
  text?: string;

  /** Filter by category */
  category?: string;

  /** Filter by tags */
  tags?: string[];

  /** Sort order */
  sortBy?: 'name' | 'category' | 'recent';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Search result
 */
export interface SearchResult {
  /** Matched documentation */
  documentation: ComponentDocumentation;

  /** Match score (0-1) */
  score: number;

  /** Matched fields */
  matches: string[];
}

/**
 * Atlas configuration
 */
export interface AtlasConfig {
  /** Atlas name */
  name?: string;

  /** Categories to include */
  categories?: string[];

  /** Auto-generate docs from TypeScript */
  autoGenerate?: boolean;

  /** Include private components */
  includePrivate?: boolean;

  /** Maximum search results */
  maxResults?: number;
}

/**
 * Atlas statistics
 */
export interface AtlasStatistics {
  /** Total documented components */
  totalComponents: number;

  /** Components by category */
  byCategory: Record<string, number>;

  /** Total examples */
  totalExamples: number;

  /** Last updated */
  lastUpdated: number;
}

/**
 * Atlas - Documentation Hub
 *
 * @example
 * ```typescript
 * const atlas = new Atlas({
 *   name: 'Synapse Component Atlas',
 *   autoGenerate: true
 * });
 *
 * // Document a component
 * atlas.document({
 *   id: 'button',
 *   name: 'Button',
 *   description: 'Interactive button component',
 *   category: 'ui',
 *   tags: ['interactive', 'form'],
 *   props: [
 *     { name: 'label', type: 'string', description: 'Button text', required: true }
 *   ],
 *   state: [],
 *   signals: [],
 *   examples: [],
 *   related: [],
 *   source: 'src/ui/components/Button.ts',
 *   timestamp: Date.now()
 * });
 *
 * // Search documentation
 * const results = atlas.search({ text: 'button', category: 'ui' });
 * ```
 */
export class Atlas extends EventEmitter {
  private readonly name: string;
  private readonly config: Required<AtlasConfig>;
  private documentation: Map<string, ComponentDocumentation> = new Map();
  private categories: Set<string> = new Set();
  private tags: Set<string> = new Set();

  constructor(config: AtlasConfig = {}) {
    super();

    this.name = config.name ?? 'Component Atlas';
    this.config = {
      name: this.name,
      categories: config.categories ?? [],
      autoGenerate: config.autoGenerate ?? false,
      includePrivate: config.includePrivate ?? false,
      maxResults: config.maxResults ?? 50,
    };
  }

  /**
   * Document a component
   */
  public document(doc: ComponentDocumentation): void {
    this.documentation.set(doc.id, doc);
    this.categories.add(doc.category);
    doc.tags.forEach((tag) => this.tags.add(tag));

    this.emit('documented', { id: doc.id, name: doc.name });
  }

  /**
   * Document a component from a VisualNeuron instance
   */
  public documentComponent<TProps extends ComponentProps = ComponentProps>(
    component: VisualNeuron<TProps>,
    metadata: {
      description: string;
      category: string;
      tags?: string[];
      examples?: CodeExample[];
      related?: string[];
    },
  ): void {
    const doc: ComponentDocumentation = {
      id: component.id,
      name: component.id,
      description: metadata.description,
      category: metadata.category,
      tags: metadata.tags ?? [],
      props: this.extractPropsDocumentation(component),
      state: this.extractStateDocumentation(component),
      signals: [],
      examples: metadata.examples ?? [],
      related: metadata.related ?? [],
      source: '',
      timestamp: Date.now(),
    };

    this.document(doc);
  }

  /**
   * Extract props documentation from component
   *
   * Note: Cannot extract props from component instance due to protected access.
   * Props should be documented manually through the document() method.
   */
  private extractPropsDocumentation<TProps extends ComponentProps>(
    _component: VisualNeuron<TProps>,
  ): PropDocumentation[] {
    // Props extraction not possible due to protected receptiveField
    return [];
  }

  /**
   * Extract state documentation from component
   *
   * Note: Cannot extract state from component instance reliably.
   * State should be documented manually through the document() method.
   */
  private extractStateDocumentation<TProps extends ComponentProps>(
    _component: VisualNeuron<TProps>,
  ): StateDocumentation[] {
    // State extraction not reliably possible
    return [];
  }

  /**
   * Get documentation by ID
   */
  public get(id: string): ComponentDocumentation | undefined {
    return this.documentation.get(id);
  }

  /**
   * Get all documentation
   */
  public getAll(): ComponentDocumentation[] {
    return Array.from(this.documentation.values());
  }

  /**
   * Search documentation
   */
  public search(query: DocumentationQuery): SearchResult[] {
    let results = this.getAll();

    // Filter by category
    if (query.category !== undefined) {
      results = results.filter((doc) => doc.category === query.category);
    }

    // Filter by tags
    if (query.tags !== undefined && query.tags.length > 0) {
      const tags = query.tags;
      results = results.filter((doc) => tags.some((tag) => doc.tags.includes(tag)));
    }

    // Text search
    const searchResults: SearchResult[] = results.map((doc) => {
      let score = 0;
      const matches: string[] = [];

      if (query.text !== undefined) {
        const searchText = query.text.toLowerCase();

        if (doc.name.toLowerCase().includes(searchText)) {
          score += 1.0;
          matches.push('name');
        }
        if (doc.description.toLowerCase().includes(searchText)) {
          score += 0.5;
          matches.push('description');
        }
        if (doc.tags.some((tag) => tag.toLowerCase().includes(searchText))) {
          score += 0.3;
          matches.push('tags');
        }
      } else {
        // No text search, include all
        score = 1.0;
      }

      return { documentation: doc, score, matches };
    });

    // Filter out zero scores
    let filtered = searchResults.filter((result) => result.score > 0);

    // Sort results
    const sortBy = query.sortBy ?? 'name';
    const sortDirection = query.sortDirection ?? 'asc';

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.documentation.name.localeCompare(b.documentation.name);
          break;
        case 'category':
          comparison = a.documentation.category.localeCompare(b.documentation.category);
          break;
        case 'recent':
          comparison = b.documentation.timestamp - a.documentation.timestamp;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Limit results
    filtered = filtered.slice(0, this.config.maxResults);

    return filtered;
  }

  /**
   * Get all categories
   */
  public getCategories(): string[] {
    return Array.from(this.categories);
  }

  /**
   * Get all tags
   */
  public getTags(): string[] {
    return Array.from(this.tags);
  }

  /**
   * Get components by category
   */
  public getByCategory(category: string): ComponentDocumentation[] {
    return this.getAll().filter((doc) => doc.category === category);
  }

  /**
   * Get components by tag
   */
  public getByTag(tag: string): ComponentDocumentation[] {
    return this.getAll().filter((doc) => doc.tags.includes(tag));
  }

  /**
   * Get related components
   */
  public getRelated(id: string): ComponentDocumentation[] {
    const doc = this.get(id);
    if (doc === undefined) return [];

    return doc.related
      .map((relatedId) => this.get(relatedId))
      .filter((d): d is ComponentDocumentation => d !== undefined);
  }

  /**
   * Remove documentation
   */
  public remove(id: string): boolean {
    const existed = this.documentation.has(id);
    this.documentation.delete(id);

    if (existed) {
      this.emit('removed', { id });
    }

    return existed;
  }

  /**
   * Clear all documentation
   */
  public clear(): void {
    this.documentation.clear();
    this.categories.clear();
    this.tags.clear();
    this.emit('cleared');
  }

  /**
   * Get atlas statistics
   */
  public getStatistics(): AtlasStatistics {
    const byCategory: Record<string, number> = {};

    this.getAll().forEach((doc) => {
      byCategory[doc.category] = (byCategory[doc.category] ?? 0) + 1;
    });

    return {
      totalComponents: this.documentation.size,
      byCategory,
      totalExamples: this.getAll().reduce((sum, doc) => sum + doc.examples.length, 0),
      lastUpdated: Math.max(...this.getAll().map((doc) => doc.timestamp), 0),
    };
  }

  /**
   * Export documentation as JSON
   */
  public export(): string {
    return JSON.stringify(
      {
        name: this.name,
        documentation: this.getAll(),
        statistics: this.getStatistics(),
        exportedAt: Date.now(),
      },
      null,
      2,
    );
  }

  /**
   * Import documentation from JSON
   */
  public import(json: string): void {
    const data = JSON.parse(json) as {
      documentation: ComponentDocumentation[];
    };

    data.documentation.forEach((doc) => this.document(doc));
    this.emit('imported', { count: data.documentation.length });
  }
}
