/**
 * ComponentCatalogue Tests
 */

import { ComponentCatalogue } from '../atlas/ComponentCatalogue';
import type { CatalogueEntry, ComponentDocumentation } from '../atlas';

describe('ComponentCatalogue - Component Inventory', () => {
  let catalogue: ComponentCatalogue;

  const createMockDoc = (id: string, category: string): ComponentDocumentation => ({
    id,
    name: id,
    description: `${id} component`,
    category,
    tags: [],
    props: [],
    state: [],
    signals: [],
    examples: [],
    related: [],
    source: '',
    timestamp: Date.now(),
  });

  const createMockEntry = (id: string, category: string): CatalogueEntry => ({
    id,
    documentation: createMockDoc(id, category),
    version: '1.0.0',
    stability: 'stable',
    dependencies: [],
    dependents: [],
    popularity: 0,
    lastUpdated: Date.now(),
    maintained: true,
  });

  beforeEach(() => {
    catalogue = new ComponentCatalogue({ name: 'Test Catalogue' });
  });

  describe('Construction', () => {
    it('should create catalogue with default config', () => {
      const defaultCatalogue = new ComponentCatalogue();
      expect(defaultCatalogue).toBeInstanceOf(ComponentCatalogue);
    });

    it('should create catalogue with custom config', () => {
      const customCatalogue = new ComponentCatalogue({
        name: 'Custom Catalogue',
        trackDependencies: true,
        trackPopularity: true,
      });
      expect(customCatalogue).toBeInstanceOf(ComponentCatalogue);
    });
  });

  describe('Add and Get', () => {
    it('should add entry to catalogue', () => {
      const entry = createMockEntry('button', 'ui');
      catalogue.add(entry);

      expect(catalogue.get('button')).toEqual(entry);
    });

    it('should emit added event', (done) => {
      const entry = createMockEntry('button', 'ui');

      catalogue.on('added', (event: { id: string }) => {
        expect(event.id).toBe('button');
        done();
      });

      catalogue.add(entry);
    });

    it('should get all entries', () => {
      catalogue.add(createMockEntry('button', 'ui'));
      catalogue.add(createMockEntry('input', 'ui'));

      expect(catalogue.getAll()).toHaveLength(2);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      catalogue.add({
        ...createMockEntry('button', 'ui'),
        stability: 'stable',
        popularity: 100,
      });

      catalogue.add({
        ...createMockEntry('input', 'ui'),
        stability: 'beta',
        popularity: 50,
      });

      catalogue.add({
        ...createMockEntry('astrocyte', 'glial'),
        stability: 'stable',
        maintained: false,
      });
    });

    it('should filter by category', () => {
      const results = catalogue.filter({ category: 'ui' });
      expect(results).toHaveLength(2);
    });

    it('should filter by stability', () => {
      const results = catalogue.filter({ stability: ['stable'] });
      expect(results).toHaveLength(2);
    });

    it('should filter by maintained status', () => {
      const results = catalogue.filter({ maintainedOnly: true });
      expect(results).toHaveLength(2);
    });

    it('should filter by minimum popularity', () => {
      const results = catalogue.filter({ minPopularity: 75 });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('button');
    });

    it('should filter by text search', () => {
      const results = catalogue.filter({ search: 'button' });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('button');
    });

    it('should filter by tags', () => {
      const entry = createMockEntry('tagged', 'ui');
      entry.documentation.tags = ['form', 'input'];
      catalogue.add(entry);

      const results = catalogue.filter({ tags: ['form'] });
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('tagged');
    });
  });

  describe('Stability and Category', () => {
    beforeEach(() => {
      catalogue.add({ ...createMockEntry('button', 'ui'), stability: 'stable' });
      catalogue.add({ ...createMockEntry('input', 'ui'), stability: 'beta' });
      catalogue.add({ ...createMockEntry('astrocyte', 'glial'), stability: 'stable' });
    });

    it('should get entries by stability', () => {
      const stable = catalogue.getByStability('stable');
      expect(stable).toHaveLength(2);
    });

    it('should get entries by category', () => {
      const ui = catalogue.getByCategory('ui');
      expect(ui).toHaveLength(2);
    });
  });

  describe('Dependencies', () => {
    beforeEach(() => {
      catalogue.add({
        ...createMockEntry('button', 'ui'),
        dependencies: ['icon', 'theme'],
      });

      catalogue.add({
        ...createMockEntry('icon', 'ui'),
        dependencies: [],
      });

      catalogue.add({
        ...createMockEntry('theme', 'ui'),
        dependencies: [],
      });
    });

    it('should track dependencies', () => {
      const deps = catalogue.getDependencies('button');
      expect(deps).toHaveLength(2);
      expect(deps).toContain('icon');
      expect(deps).toContain('theme');
    });

    it('should track dependents', () => {
      const dependents = catalogue.getDependents('icon');
      expect(dependents).toContain('button');
    });

    it('should get recursive dependencies', () => {
      catalogue.add({
        ...createMockEntry('complex-button', 'ui'),
        dependencies: ['button'],
      });

      const deps = catalogue.getDependencies('complex-button', true);
      expect(deps).toContain('button');
      expect(deps).toContain('icon');
      expect(deps).toContain('theme');
    });

    it('should get recursive dependents', () => {
      catalogue.add({
        ...createMockEntry('complex-button', 'ui'),
        dependencies: ['button'],
      });

      const dependents = catalogue.getDependents('icon', true);
      expect(dependents).toContain('button');
      expect(dependents).toContain('complex-button');
    });
  });

  describe('Dependency Graph', () => {
    beforeEach(() => {
      catalogue.add({
        ...createMockEntry('button', 'ui'),
        dependencies: ['icon'],
      });

      catalogue.add({
        ...createMockEntry('icon', 'ui'),
        dependencies: [],
      });
    });

    it('should generate dependency graph', () => {
      const graph = catalogue.getDependencyGraph();

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]!.from).toBe('button');
      expect(graph.edges[0]!.to).toBe('icon');
    });
  });

  describe('Groups', () => {
    beforeEach(() => {
      catalogue.add(createMockEntry('button', 'ui'));
      catalogue.add(createMockEntry('input', 'ui'));
    });

    it('should create a group', () => {
      catalogue.createGroup('Form Components', 'Form-related components', ['button', 'input']);

      const group = catalogue.getGroup('Form Components');
      expect(group).toBeDefined();
      expect(group!.components).toHaveLength(2);
    });

    it('should emit group:created event', (done) => {
      catalogue.on('group:created', (event: { name: string }) => {
        expect(event.name).toBe('UI Components');
        done();
      });

      catalogue.createGroup('UI Components', 'UI components', []);
    });

    it('should get all groups', () => {
      catalogue.createGroup('Group1', 'Description', []);
      catalogue.createGroup('Group2', 'Description', []);

      expect(catalogue.getGroups()).toHaveLength(2);
    });

    it('should add component to group', () => {
      catalogue.createGroup('UI Components', 'UI components', []);
      catalogue.addToGroup('UI Components', 'button');

      const group = catalogue.getGroup('UI Components');
      expect(group!.components).toContain('button');
    });

    it('should throw error when adding to nonexistent group', () => {
      expect(() => {
        catalogue.addToGroup('Nonexistent', 'button');
      }).toThrow('Group not found: Nonexistent');
    });
  });

  describe('Popularity', () => {
    beforeEach(() => {
      catalogue.add({ ...createMockEntry('button', 'ui'), popularity: 10 });
    });

    it('should increment popularity', () => {
      catalogue.incrementPopularity('button', 5);

      const entry = catalogue.get('button');
      expect(entry!.popularity).toBe(15);
    });

    it('should emit popularity:updated event', (done) => {
      catalogue.on('popularity:updated', (event: { id: string; popularity: number }) => {
        expect(event.id).toBe('button');
        expect(event.popularity).toBe(11);
        done();
      });

      catalogue.incrementPopularity('button');
    });
  });

  describe('Update and Remove', () => {
    beforeEach(() => {
      catalogue.add(createMockEntry('button', 'ui'));
    });

    it('should update entry', () => {
      catalogue.update('button', { stability: 'deprecated' });

      const entry = catalogue.get('button');
      expect(entry!.stability).toBe('deprecated');
    });

    it('should update lastUpdated timestamp', () => {
      const before = catalogue.get('button')!.lastUpdated;

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        catalogue.update('button', { popularity: 100 });

        const after = catalogue.get('button')!.lastUpdated;
        expect(after).toBeGreaterThan(before);
      }, 10);
    });

    it('should throw error when updating nonexistent component', () => {
      expect(() => {
        catalogue.update('nonexistent', { stability: 'stable' });
      }).toThrow('Component not found: nonexistent');
    });

    it('should remove entry', () => {
      expect(catalogue.remove('button')).toBe(true);
      expect(catalogue.get('button')).toBeUndefined();
    });

    it('should remove entry from groups', () => {
      catalogue.createGroup('UI Components', 'UI components', ['button']);
      catalogue.remove('button');

      const group = catalogue.getGroup('UI Components');
      expect(group!.components).not.toContain('button');
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      catalogue.add({
        ...createMockEntry('button', 'ui'),
        stability: 'stable',
        popularity: 100,
        dependencies: ['icon', 'theme'],
      });

      catalogue.add({
        ...createMockEntry('input', 'ui'),
        stability: 'beta',
        popularity: 50,
        maintained: false,
      });

      catalogue.add({
        ...createMockEntry('astrocyte', 'glial'),
        stability: 'stable',
        popularity: 75,
      });
    });

    it('should calculate statistics', () => {
      const stats = catalogue.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.byStability['stable']).toBe(2);
      expect(stats.byStability['beta']).toBe(1);
      expect(stats.byCategory['ui']).toBe(2);
      expect(stats.byCategory['glial']).toBe(1);
      expect(stats.maintenanceStatus['maintained']).toBe(2);
      expect(stats.maintenanceStatus['unmaintained']).toBe(1);
      expect(stats.averagePopularity).toBe(75);
    });

    it('should list most popular components', () => {
      const stats = catalogue.getStatistics();

      expect(stats.mostPopular[0]!.id).toBe('button');
      expect(stats.mostPopular[0]!.popularity).toBe(100);
    });

    it('should list components with most dependencies', () => {
      const stats = catalogue.getStatistics();

      expect(stats.mostDependencies[0]!.id).toBe('button');
      expect(stats.mostDependencies[0]!.count).toBe(2);
    });
  });

  describe('Import/Export', () => {
    it('should export catalogue as JSON', () => {
      catalogue.add(createMockEntry('button', 'ui'));
      catalogue.createGroup('UI Components', 'UI components', ['button']);

      const exported = catalogue.export();
      const parsed = JSON.parse(exported);

      expect(parsed.name).toBe('Test Catalogue');
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.groups).toHaveLength(1);
    });

    it('should import catalogue from JSON', () => {
      const entry = createMockEntry('button', 'ui');
      const group = {
        name: 'UI Components',
        description: 'UI components',
        components: ['button'],
        subgroups: [],
      };

      const json = JSON.stringify({
        entries: [entry],
        groups: [group],
      });

      catalogue.import(json);

      expect(catalogue.get('button')).toBeDefined();
      expect(catalogue.getGroup('UI Components')).toBeDefined();
    });

    it('should emit imported event', (done) => {
      const json = JSON.stringify({
        entries: [createMockEntry('button', 'ui')],
        groups: [],
      });

      catalogue.on('imported', (event: { entries: number; groups: number }) => {
        expect(event.entries).toBe(1);
        expect(event.groups).toBe(0);
        done();
      });

      catalogue.import(json);
    });
  });

  describe('Clear', () => {
    beforeEach(() => {
      catalogue.add(createMockEntry('button', 'ui'));
      catalogue.createGroup('UI Components', 'UI components', []);
    });

    it('should clear all data', () => {
      catalogue.clear();

      expect(catalogue.getAll()).toHaveLength(0);
      expect(catalogue.getGroups()).toHaveLength(0);
    });

    it('should emit cleared event', (done) => {
      catalogue.on('cleared', () => {
        done();
      });

      catalogue.clear();
    });
  });
});
