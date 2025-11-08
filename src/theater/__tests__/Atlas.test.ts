/**
 * Atlas Tests
 */

import { Atlas } from '../atlas/Atlas';
import type { ComponentDocumentation } from '../atlas/Atlas';

describe('Atlas - Documentation Hub', () => {
  let atlas: Atlas;

  beforeEach(() => {
    atlas = new Atlas({ name: 'Test Atlas' });
  });

  describe('Construction', () => {
    it('should create atlas with default config', () => {
      const defaultAtlas = new Atlas();
      expect(defaultAtlas).toBeInstanceOf(Atlas);
    });

    it('should create atlas with custom config', () => {
      const customAtlas = new Atlas({
        name: 'Custom Atlas',
        autoGenerate: true,
        maxResults: 100,
      });
      expect(customAtlas).toBeInstanceOf(Atlas);
    });
  });

  describe('Documentation', () => {
    it('should document a component', () => {
      const doc: ComponentDocumentation = {
        id: 'button',
        name: 'Button',
        description: 'Interactive button component',
        category: 'ui',
        tags: ['interactive', 'form'],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: 'src/ui/components/Button.ts',
        timestamp: Date.now(),
      };

      atlas.document(doc);
      expect(atlas.get('button')).toEqual(doc);
    });

    it('should emit documented event', (done) => {
      const doc: ComponentDocumentation = {
        id: 'input',
        name: 'Input',
        description: 'Text input component',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      atlas.on('documented', (event: { id: string; name: string }) => {
        expect(event.id).toBe('input');
        expect(event.name).toBe('Input');
        done();
      });

      atlas.document(doc);
    });

    it('should get all documentation', () => {
      const doc1: ComponentDocumentation = {
        id: 'component1',
        name: 'Component1',
        description: 'First component',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      const doc2: ComponentDocumentation = {
        id: 'component2',
        name: 'Component2',
        description: 'Second component',
        category: 'glial',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      atlas.document(doc1);
      atlas.document(doc2);

      expect(atlas.getAll()).toHaveLength(2);
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      const docs: ComponentDocumentation[] = [
        {
          id: 'button',
          name: 'Button',
          description: 'Interactive button component',
          category: 'ui',
          tags: ['interactive', 'form'],
          props: [],
          state: [],
          signals: [],
          examples: [],
          related: [],
          source: '',
          timestamp: Date.now(),
        },
        {
          id: 'input',
          name: 'Input',
          description: 'Text input field',
          category: 'ui',
          tags: ['form', 'text'],
          props: [],
          state: [],
          signals: [],
          examples: [],
          related: [],
          source: '',
          timestamp: Date.now(),
        },
        {
          id: 'astrocyte',
          name: 'Astrocyte',
          description: 'State management component',
          category: 'glial',
          tags: ['state', 'management'],
          props: [],
          state: [],
          signals: [],
          examples: [],
          related: [],
          source: '',
          timestamp: Date.now(),
        },
      ];

      docs.forEach((doc) => atlas.document(doc));
    });

    it('should search by text', () => {
      const results = atlas.search({ text: 'button' });
      expect(results).toHaveLength(1);
      expect(results[0].documentation.id).toBe('button');
    });

    it('should search by category', () => {
      const results = atlas.search({ category: 'ui' });
      expect(results).toHaveLength(2);
    });

    it('should search by tags', () => {
      const results = atlas.search({ tags: ['form'] });
      expect(results).toHaveLength(2);
    });

    it('should search with multiple filters', () => {
      const results = atlas.search({ category: 'ui', tags: ['form'] });
      expect(results).toHaveLength(2);
    });

    it('should sort search results by name', () => {
      const results = atlas.search({ category: 'ui', sortBy: 'name', sortDirection: 'asc' });
      expect(results[0].documentation.name).toBe('Button');
      expect(results[1].documentation.name).toBe('Input');
    });

    it('should return empty array when no matches', () => {
      const results = atlas.search({ text: 'nonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('Categories and Tags', () => {
    beforeEach(() => {
      const doc: ComponentDocumentation = {
        id: 'button',
        name: 'Button',
        description: 'Interactive button',
        category: 'ui',
        tags: ['interactive', 'form'],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      atlas.document(doc);
    });

    it('should get all categories', () => {
      expect(atlas.getCategories()).toContain('ui');
    });

    it('should get all tags', () => {
      const tags = atlas.getTags();
      expect(tags).toContain('interactive');
      expect(tags).toContain('form');
    });

    it('should get components by category', () => {
      const components = atlas.getByCategory('ui');
      expect(components).toHaveLength(1);
      expect(components[0].id).toBe('button');
    });

    it('should get components by tag', () => {
      const components = atlas.getByTag('interactive');
      expect(components).toHaveLength(1);
      expect(components[0].id).toBe('button');
    });
  });

  describe('Related Components', () => {
    beforeEach(() => {
      const button: ComponentDocumentation = {
        id: 'button',
        name: 'Button',
        description: 'Interactive button',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: ['icon', 'tooltip'],
        source: '',
        timestamp: Date.now(),
      };

      const icon: ComponentDocumentation = {
        id: 'icon',
        name: 'Icon',
        description: 'Icon component',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      const tooltip: ComponentDocumentation = {
        id: 'tooltip',
        name: 'Tooltip',
        description: 'Tooltip component',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      atlas.document(button);
      atlas.document(icon);
      atlas.document(tooltip);
    });

    it('should get related components', () => {
      const related = atlas.getRelated('button');
      expect(related).toHaveLength(2);
      expect(related.map((r) => r.id)).toContain('icon');
      expect(related.map((r) => r.id)).toContain('tooltip');
    });

    it('should return empty array for component with no relations', () => {
      const related = atlas.getRelated('icon');
      expect(related).toHaveLength(0);
    });

    it('should return empty array for nonexistent component', () => {
      const related = atlas.getRelated('nonexistent');
      expect(related).toHaveLength(0);
    });
  });

  describe('Remove and Clear', () => {
    beforeEach(() => {
      const doc: ComponentDocumentation = {
        id: 'button',
        name: 'Button',
        description: 'Interactive button',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      atlas.document(doc);
    });

    it('should remove documentation', () => {
      expect(atlas.remove('button')).toBe(true);
      expect(atlas.get('button')).toBeUndefined();
    });

    it('should return false when removing nonexistent doc', () => {
      expect(atlas.remove('nonexistent')).toBe(false);
    });

    it('should emit removed event', (done) => {
      atlas.on('removed', (event: { id: string }) => {
        expect(event.id).toBe('button');
        done();
      });

      atlas.remove('button');
    });

    it('should clear all documentation', () => {
      atlas.clear();
      expect(atlas.getAll()).toHaveLength(0);
    });

    it('should emit cleared event', (done) => {
      atlas.on('cleared', () => {
        done();
      });

      atlas.clear();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      const docs: ComponentDocumentation[] = [
        {
          id: 'button',
          name: 'Button',
          description: 'Button',
          category: 'ui',
          tags: [],
          props: [],
          state: [],
          signals: [],
          examples: [{ title: 'Example 1', description: '', code: '', language: 'ts' }],
          related: [],
          source: '',
          timestamp: Date.now(),
        },
        {
          id: 'input',
          name: 'Input',
          description: 'Input',
          category: 'ui',
          tags: [],
          props: [],
          state: [],
          signals: [],
          examples: [
            { title: 'Example 1', description: '', code: '', language: 'ts' },
            { title: 'Example 2', description: '', code: '', language: 'ts' },
          ],
          related: [],
          source: '',
          timestamp: Date.now(),
        },
        {
          id: 'astrocyte',
          name: 'Astrocyte',
          description: 'Astrocyte',
          category: 'glial',
          tags: [],
          props: [],
          state: [],
          signals: [],
          examples: [],
          related: [],
          source: '',
          timestamp: Date.now(),
        },
      ];

      docs.forEach((doc) => atlas.document(doc));
    });

    it('should calculate statistics', () => {
      const stats = atlas.getStatistics();
      expect(stats.totalComponents).toBe(3);
      expect(stats.byCategory.ui).toBe(2);
      expect(stats.byCategory.glial).toBe(1);
      expect(stats.totalExamples).toBe(3);
    });
  });

  describe('Import/Export', () => {
    it('should export documentation as JSON', () => {
      const doc: ComponentDocumentation = {
        id: 'button',
        name: 'Button',
        description: 'Button',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      atlas.document(doc);

      const exported = atlas.export();
      const parsed = JSON.parse(exported);

      expect(parsed.name).toBe('Test Atlas');
      expect(parsed.documentation).toHaveLength(1);
    });

    it('should import documentation from JSON', () => {
      const doc: ComponentDocumentation = {
        id: 'button',
        name: 'Button',
        description: 'Button',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      const json = JSON.stringify({
        documentation: [doc],
      });

      atlas.import(json);
      expect(atlas.get('button')).toBeDefined();
    });

    it('should emit imported event', (done) => {
      const doc: ComponentDocumentation = {
        id: 'button',
        name: 'Button',
        description: 'Button',
        category: 'ui',
        tags: [],
        props: [],
        state: [],
        signals: [],
        examples: [],
        related: [],
        source: '',
        timestamp: Date.now(),
      };

      const json = JSON.stringify({
        documentation: [doc],
      });

      atlas.on('imported', (event: { count: number }) => {
        expect(event.count).toBe(1);
        done();
      });

      atlas.import(json);
    });
  });
});
