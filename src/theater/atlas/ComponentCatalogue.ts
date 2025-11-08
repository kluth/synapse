/**
 * ComponentCatalogue - Component Inventory and Organization
 *
 * The ComponentCatalogue provides a structured inventory of all components,
 * with advanced filtering, categorization, and dependency tracking.
 *
 * Medical Metaphor: A medical catalogue systematically organizes and classifies
 * specimens, instruments, and procedures for easy reference.
 */

import { EventEmitter } from 'events';
import type { ComponentDocumentation } from './Atlas';

/**
 * Component entry in the catalogue
 */
export interface CatalogueEntry {
  /** Entry ID */
  id: string;

  /** Component documentation */
  documentation: ComponentDocumentation;

  /** Component version */
  version: string;

  /** Stability level */
  stability: 'experimental' | 'beta' | 'stable' | 'deprecated';

  /** Dependencies */
  dependencies: string[];

  /** Dependents (components that depend on this) */
  dependents: string[];

  /** Installation count/popularity */
  popularity: number;

  /** Last updated timestamp */
  lastUpdated: number;

  /** Maintenance status */
  maintained: boolean;
}

/**
 * Catalogue filter
 */
export interface CatalogueFilter {
  /** Filter by category */
  category?: string;

  /** Filter by stability */
  stability?: Array<'experimental' | 'beta' | 'stable' | 'deprecated'>;

  /** Filter by tags */
  tags?: string[];

  /** Only maintained components */
  maintainedOnly?: boolean;

  /** Minimum popularity */
  minPopularity?: number;

  /** Text search */
  search?: string;
}

/**
 * Catalogue group
 */
export interface CatalogueGroup {
  /** Group name */
  name: string;

  /** Group description */
  description: string;

  /** Component IDs in this group */
  components: string[];

  /** Subgroups */
  subgroups: CatalogueGroup[];
}

/**
 * Component dependency graph
 */
export interface DependencyGraph {
  /** Nodes (components) */
  nodes: Array<{
    id: string;
    name: string;
    category: string;
  }>;

  /** Edges (dependencies) */
  edges: Array<{
    from: string;
    to: string;
    type: 'dependency' | 'optional';
  }>;
}

/**
 * Catalogue configuration
 */
export interface CatalogueConfig {
  /** Catalogue name */
  name?: string;

  /** Track dependencies */
  trackDependencies?: boolean;

  /** Track popularity */
  trackPopularity?: boolean;

  /** Auto-update entries */
  autoUpdate?: boolean;
}

/**
 * Catalogue statistics
 */
export interface CatalogueStatistics {
  /** Total entries */
  total: number;

  /** By stability level */
  byStability: Record<string, number>;

  /** By category */
  byCategory: Record<string, number>;

  /** Maintained vs unmaintained */
  maintenanceStatus: {
    maintained: number;
    unmaintained: number;
  };

  /** Average popularity */
  averagePopularity: number;

  /** Most popular components */
  mostPopular: Array<{ id: string; popularity: number }>;

  /** Most dependencies */
  mostDependencies: Array<{ id: string; count: number }>;
}

/**
 * ComponentCatalogue - Component Inventory
 *
 * @example
 * ```typescript
 * const catalogue = new ComponentCatalogue({
 *   trackDependencies: true,
 *   trackPopularity: true
 * });
 *
 * // Add component
 * catalogue.add({
 *   id: 'button',
 *   documentation: buttonDocs,
 *   version: '1.0.0',
 *   stability: 'stable',
 *   dependencies: [],
 *   dependents: [],
 *   popularity: 100,
 *   lastUpdated: Date.now(),
 *   maintained: true
 * });
 *
 * // Filter components
 * const stable = catalogue.filter({ stability: ['stable'] });
 * ```
 */
export class ComponentCatalogue extends EventEmitter {
  private readonly name: string;
  private readonly config: Required<CatalogueConfig>;
  private entries: Map<string, CatalogueEntry> = new Map();
  private groups: Map<string, CatalogueGroup> = new Map();

  constructor(config: CatalogueConfig = {}) {
    super();

    this.name = config.name ?? 'Component Catalogue';
    this.config = {
      name: this.name,
      trackDependencies: config.trackDependencies ?? true,
      trackPopularity: config.trackPopularity ?? true,
      autoUpdate: config.autoUpdate ?? false,
    };
  }

  /**
   * Add component to catalogue
   */
  public add(entry: CatalogueEntry): void {
    this.entries.set(entry.id, entry);

    // Update dependency tracking
    if (this.config.trackDependencies) {
      this.updateDependencyTracking(entry);
    }

    this.emit('added', { id: entry.id });
  }

  /**
   * Update dependency tracking for an entry
   */
  private updateDependencyTracking(entry: CatalogueEntry): void {
    // Update dependents for all dependencies
    entry.dependencies.forEach((depId) => {
      const dep = this.entries.get(depId);
      if (dep !== undefined && !dep.dependents.includes(entry.id)) {
        dep.dependents.push(entry.id);
      }
    });

    // Update this entry's dependents list if other entries depend on it
    this.entries.forEach((otherEntry) => {
      if (otherEntry.id !== entry.id && otherEntry.dependencies.includes(entry.id)) {
        if (!entry.dependents.includes(otherEntry.id)) {
          entry.dependents.push(otherEntry.id);
        }
      }
    });
  }

  /**
   * Get entry by ID
   */
  public get(id: string): CatalogueEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Get all entries
   */
  public getAll(): CatalogueEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Filter entries
   */
  public filter(filter: CatalogueFilter): CatalogueEntry[] {
    let results = this.getAll();

    // Filter by category
    if (filter.category !== undefined) {
      results = results.filter((entry) => entry.documentation.category === filter.category);
    }

    // Filter by stability
    if (filter.stability !== undefined && filter.stability.length > 0) {
      const stability = filter.stability;
      results = results.filter((entry) => stability.includes(entry.stability));
    }

    // Filter by tags
    if (filter.tags !== undefined && filter.tags.length > 0) {
      const tags = filter.tags;
      results = results.filter((entry) =>
        tags.some((tag) => entry.documentation.tags.includes(tag)),
      );
    }

    // Filter by maintained status
    if (filter.maintainedOnly === true) {
      results = results.filter((entry) => entry.maintained);
    }

    // Filter by minimum popularity
    if (filter.minPopularity !== undefined) {
      const minPopularity = filter.minPopularity;
      results = results.filter((entry) => entry.popularity >= minPopularity);
    }

    // Text search
    if (filter.search !== undefined) {
      const searchText = filter.search.toLowerCase();
      results = results.filter(
        (entry) =>
          entry.documentation.name.toLowerCase().includes(searchText) ||
          entry.documentation.description.toLowerCase().includes(searchText) ||
          entry.documentation.tags.some((tag) => tag.toLowerCase().includes(searchText)),
      );
    }

    return results;
  }

  /**
   * Get entries by stability
   */
  public getByStability(stability: CatalogueEntry['stability']): CatalogueEntry[] {
    return this.getAll().filter((entry) => entry.stability === stability);
  }

  /**
   * Get entries by category
   */
  public getByCategory(category: string): CatalogueEntry[] {
    return this.getAll().filter((entry) => entry.documentation.category === category);
  }

  /**
   * Get component dependencies
   */
  public getDependencies(id: string, recursive: boolean = false): string[] {
    const entry = this.get(id);
    if (entry === undefined) return [];

    if (!recursive) {
      return entry.dependencies;
    }

    // Recursive dependency collection
    const deps = new Set<string>();
    const visited = new Set<string>();

    const collectDeps = (componentId: string): void => {
      if (visited.has(componentId)) return;
      visited.add(componentId);

      const component = this.get(componentId);
      if (component === undefined) return;

      component.dependencies.forEach((depId) => {
        deps.add(depId);
        collectDeps(depId);
      });
    };

    collectDeps(id);
    return Array.from(deps);
  }

  /**
   * Get component dependents
   */
  public getDependents(id: string, recursive: boolean = false): string[] {
    const entry = this.get(id);
    if (entry === undefined) return [];

    if (!recursive) {
      return entry.dependents;
    }

    // Recursive dependent collection
    const dependents = new Set<string>();
    const visited = new Set<string>();

    const collectDependents = (componentId: string): void => {
      if (visited.has(componentId)) return;
      visited.add(componentId);

      const component = this.get(componentId);
      if (component === undefined) return;

      component.dependents.forEach((depId) => {
        dependents.add(depId);
        collectDependents(depId);
      });
    };

    collectDependents(id);
    return Array.from(dependents);
  }

  /**
   * Get dependency graph
   */
  public getDependencyGraph(): DependencyGraph {
    const nodes = this.getAll().map((entry) => ({
      id: entry.id,
      name: entry.documentation.name,
      category: entry.documentation.category,
    }));

    const edges: DependencyGraph['edges'] = [];

    this.getAll().forEach((entry) => {
      entry.dependencies.forEach((depId) => {
        edges.push({
          from: entry.id,
          to: depId,
          type: 'dependency',
        });
      });
    });

    return { nodes, edges };
  }

  /**
   * Create a group
   */
  public createGroup(name: string, description: string, componentIds: string[]): void {
    const group: CatalogueGroup = {
      name,
      description,
      components: componentIds,
      subgroups: [],
    };

    this.groups.set(name, group);
    this.emit('group:created', { name });
  }

  /**
   * Get group
   */
  public getGroup(name: string): CatalogueGroup | undefined {
    return this.groups.get(name);
  }

  /**
   * Get all groups
   */
  public getGroups(): CatalogueGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Add component to group
   */
  public addToGroup(groupName: string, componentId: string): void {
    const group = this.groups.get(groupName);
    if (group === undefined) {
      throw new Error(`Group not found: ${groupName}`);
    }

    if (!group.components.includes(componentId)) {
      group.components.push(componentId);
      this.emit('group:updated', { name: groupName });
    }
  }

  /**
   * Increment popularity
   */
  public incrementPopularity(id: string, amount: number = 1): void {
    const entry = this.get(id);
    if (entry === undefined) return;

    entry.popularity += amount;
    this.emit('popularity:updated', { id, popularity: entry.popularity });
  }

  /**
   * Update entry
   */
  public update(id: string, updates: Partial<CatalogueEntry>): void {
    const entry = this.get(id);
    if (entry === undefined) {
      throw new Error(`Component not found: ${id}`);
    }

    Object.assign(entry, updates);
    entry.lastUpdated = Date.now();

    this.emit('updated', { id });
  }

  /**
   * Remove entry
   */
  public remove(id: string): boolean {
    const existed = this.entries.has(id);
    this.entries.delete(id);

    if (existed) {
      // Remove from all groups
      this.groups.forEach((group) => {
        group.components = group.components.filter((cid) => cid !== id);
      });

      this.emit('removed', { id });
    }

    return existed;
  }

  /**
   * Clear catalogue
   */
  public clear(): void {
    this.entries.clear();
    this.groups.clear();
    this.emit('cleared');
  }

  /**
   * Get catalogue statistics
   */
  public getStatistics(): CatalogueStatistics {
    const entries = this.getAll();

    const byStability: Record<string, number> = {
      experimental: 0,
      beta: 0,
      stable: 0,
      deprecated: 0,
    };

    const byCategory: Record<string, number> = {};

    let maintained = 0;
    let totalPopularity = 0;

    entries.forEach((entry) => {
      byStability[entry.stability] = (byStability[entry.stability] ?? 0) + 1;
      byCategory[entry.documentation.category] =
        (byCategory[entry.documentation.category] ?? 0) + 1;

      if (entry.maintained) maintained++;
      totalPopularity += entry.popularity;
    });

    const mostPopular = entries
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10)
      .map((e) => ({ id: e.id, popularity: e.popularity }));

    const mostDependencies = entries
      .sort((a, b) => b.dependencies.length - a.dependencies.length)
      .slice(0, 10)
      .map((e) => ({ id: e.id, count: e.dependencies.length }));

    return {
      total: entries.length,
      byStability,
      byCategory,
      maintenanceStatus: {
        maintained,
        unmaintained: entries.length - maintained,
      },
      averagePopularity: entries.length > 0 ? totalPopularity / entries.length : 0,
      mostPopular,
      mostDependencies,
    };
  }

  /**
   * Export catalogue as JSON
   */
  public export(): string {
    return JSON.stringify(
      {
        name: this.name,
        entries: this.getAll(),
        groups: this.getGroups(),
        statistics: this.getStatistics(),
        exportedAt: Date.now(),
      },
      null,
      2,
    );
  }

  /**
   * Import catalogue from JSON
   */
  public import(json: string): void {
    const data = JSON.parse(json) as {
      entries: CatalogueEntry[];
      groups: CatalogueGroup[];
    };

    data.entries.forEach((entry) => this.add(entry));
    data.groups.forEach((group) => this.groups.set(group.name, group));

    this.emit('imported', {
      entries: data.entries.length,
      groups: data.groups.length,
    });
  }
}
