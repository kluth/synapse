/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/require-await, @typescript-eslint/prefer-optional-chain */
/**
 * Amphitheater - Component observation gallery
 *
 * The Amphitheater is the main UI where developers browse, search,
 * and observe components. It provides the navigation, filtering,
 * and organization of specimens.
 */

import { EventEmitter } from 'events';

/**
 * Specimen category
 */
export interface SpecimenCategory {
  id: string;
  name: string;
  description?: string;
  specimens: string[];
}

/**
 * Specimen metadata
 */
export interface SpecimenMetadata {
  id: string;
  name: string;
  category: string;
  tags: string[];
  description?: string;
  variations?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Amphitheater theme
 */
export type AmphitheaterTheme = 'light' | 'dark' | 'auto';

/**
 * Amphitheater layout
 */
export type AmphitheaterLayout = 'grid' | 'list' | 'canvas';

/**
 * Amphitheater configuration
 */
export interface AmphitheaterConfig {
  /**
   * Theme mode
   * @default 'auto'
   */
  theme?: AmphitheaterTheme;

  /**
   * Layout mode
   * @default 'grid'
   */
  layout?: AmphitheaterLayout;

  /**
   * Enable search
   * @default true
   */
  search?: boolean;

  /**
   * Enable keyboard navigation
   * @default true
   */
  keyboardNav?: boolean;

  /**
   * Show specimen count
   * @default true
   */
  showCount?: boolean;
}

/**
 * Search/Filter criteria
 */
export interface FilterCriteria {
  query?: string;
  category?: string;
  tags?: string[];
}

/**
 * Amphitheater - Component gallery
 */
export class Amphitheater extends EventEmitter {
  private theme: AmphitheaterTheme;
  private layout: AmphitheaterLayout;
  private searchEnabled: boolean;
  private keyboardNavEnabled: boolean;
  private showCount: boolean;

  private specimens: Map<string, SpecimenMetadata> = new Map();
  private categories: Map<string, SpecimenCategory> = new Map();
  private selectedSpecimen: string | null = null;
  private filterCriteria: FilterCriteria = {};

  constructor(config: AmphitheaterConfig = {}) {
    super();
    this.theme = config.theme ?? 'auto';
    this.layout = config.layout ?? 'grid';
    this.searchEnabled = config.search ?? true;
    this.keyboardNavEnabled = config.keyboardNav ?? true;
    this.showCount = config.showCount ?? true;
  }

  /**
   * Initialize the amphitheater
   */
  public async initialize(): Promise<void> {
    if (this.keyboardNavEnabled) {
      this.setupKeyboardNavigation();
    }
    this.emit('initialized');
  }

  /**
   * Register a specimen
   */
  public registerSpecimen(metadata: SpecimenMetadata): void {
    this.specimens.set(metadata.id, metadata);

    // Add to category
    const category = this.categories.get(metadata.category);
    if (category !== undefined) {
      if (!category.specimens.includes(metadata.id)) {
        category.specimens.push(metadata.id);
      }
    } else {
      // Create category
      this.categories.set(metadata.category, {
        id: metadata.category,
        name: metadata.category,
        specimens: [metadata.id],
      });
    }

    this.emit('specimen:registered', { metadata });
  }

  /**
   * Unregister a specimen
   */
  public unregisterSpecimen(id: string): void {
    const specimen = this.specimens.get(id);
    if (specimen === undefined) {
      return;
    }

    // Remove from category
    const category = this.categories.get(specimen.category);
    if (category !== undefined) {
      category.specimens = category.specimens.filter((sid) => sid !== id);
    }

    this.specimens.delete(id);
    this.emit('specimen:unregistered', { id });
  }

  /**
   * Get all specimens
   */
  public getSpecimens(): SpecimenMetadata[] {
    return Array.from(this.specimens.values());
  }

  /**
   * Get filtered specimens
   */
  public getFilteredSpecimens(): SpecimenMetadata[] {
    let filtered = this.getSpecimens();

    // Filter by category
    if (this.filterCriteria.category !== undefined) {
      filtered = filtered.filter((s) => s.category === this.filterCriteria.category);
    }

    // Filter by tags
    if (this.filterCriteria.tags !== undefined && this.filterCriteria.tags.length > 0) {
      filtered = filtered.filter((s) =>
        this.filterCriteria.tags!.some((tag) => s.tags.includes(tag)),
      );
    }

    // Filter by search query
    if (this.filterCriteria.query !== undefined && this.filterCriteria.query.length > 0) {
      const query = this.filterCriteria.query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.description !== undefined && s.description.toLowerCase().includes(query)) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }

  /**
   * Get specimen by ID
   */
  public getSpecimen(id: string): SpecimenMetadata | undefined {
    return this.specimens.get(id);
  }

  /**
   * Select a specimen
   */
  public selectSpecimen(id: string): void {
    if (!this.specimens.has(id)) {
      throw new Error(`Specimen not found: ${id}`);
    }

    this.selectedSpecimen = id;
    this.emit('specimen:selected', { id });
  }

  /**
   * Get selected specimen
   */
  public getSelectedSpecimen(): SpecimenMetadata | null {
    if (this.selectedSpecimen === null) {
      return null;
    }
    return this.specimens.get(this.selectedSpecimen) ?? null;
  }

  /**
   * Get all categories
   */
  public getCategories(): SpecimenCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get specimens by category
   */
  public getSpecimensByCategory(categoryId: string): SpecimenMetadata[] {
    const category = this.categories.get(categoryId);
    if (category === undefined) {
      return [];
    }

    return category.specimens
      .map((id) => this.specimens.get(id))
      .filter((s): s is SpecimenMetadata => s !== undefined);
  }

  /**
   * Set filter criteria
   */
  public setFilter(criteria: FilterCriteria): void {
    this.filterCriteria = { ...criteria };
    this.emit('filter:change', { criteria: this.filterCriteria });
  }

  /**
   * Clear filters
   */
  public clearFilter(): void {
    this.filterCriteria = {};
    this.emit('filter:clear');
  }

  /**
   * Search specimens
   */
  public search(query: string): SpecimenMetadata[] {
    this.setFilter({ ...this.filterCriteria, query });
    return this.getFilteredSpecimens();
  }

  /**
   * Set theme
   */
  public setTheme(theme: AmphitheaterTheme): void {
    this.theme = theme;
    this.emit('theme:change', { theme });
  }

  /**
   * Get current theme
   */
  public getTheme(): AmphitheaterTheme {
    return this.theme;
  }

  /**
   * Set layout
   */
  public setLayout(layout: AmphitheaterLayout): void {
    this.layout = layout;
    this.emit('layout:change', { layout });
  }

  /**
   * Get current layout
   */
  public getLayout(): AmphitheaterLayout {
    return this.layout;
  }

  /**
   * Toggle theme (light/dark)
   */
  public toggleTheme(): void {
    if (this.theme === 'light') {
      this.setTheme('dark');
    } else if (this.theme === 'dark') {
      this.setTheme('light');
    }
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalSpecimens: number;
    totalCategories: number;
    filteredCount: number;
    selectedSpecimen: string | null;
  } {
    return {
      totalSpecimens: this.specimens.size,
      totalCategories: this.categories.size,
      filteredCount: this.getFilteredSpecimens().length,
      selectedSpecimen: this.selectedSpecimen,
    };
  }

  /**
   * Render amphitheater UI (basic HTML)
   */
  public render(): string {
    const specimens = this.getFilteredSpecimens();
    const stats = this.getStats();

    return `
      <div class="amphitheater amphitheater--${this.theme} amphitheater--${this.layout}">
        <div class="amphitheater__header">
          <h1>The Anatomy Theater</h1>
          ${this.showCount ? `<span class="specimen-count">${stats.filteredCount} specimens</span>` : ''}
        </div>

        ${this.searchEnabled ? '<div class="amphitheater__search"><input type="search" placeholder="Search specimens..." /></div>' : ''}

        <div class="amphitheater__categories">
          ${this.getCategories()
            .map(
              (cat) => `
            <div class="category">
              <h2>${cat.name}</h2>
              ${cat.description !== undefined ? `<p>${cat.description}</p>` : ''}
            </div>
          `,
            )
            .join('')}
        </div>

        <div class="amphitheater__specimens amphitheater__specimens--${this.layout}">
          ${specimens
            .map(
              (spec) => `
            <div class="specimen-card" data-id="${spec.id}">
              <h3>${spec.name}</h3>
              ${spec.description !== undefined ? `<p>${spec.description}</p>` : ''}
              <div class="specimen-tags">
                ${spec.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    // Would setup keyboard event listeners in real implementation
    // Arrow keys for navigation, Enter to select, etc.
  }

  /**
   * Cleanup
   */
  public async cleanup(): Promise<void> {
    this.specimens.clear();
    this.categories.clear();
    this.selectedSpecimen = null;
    this.filterCriteria = {};
    this.emit('cleanup');
  }
}
