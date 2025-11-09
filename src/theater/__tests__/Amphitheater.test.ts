import { Amphitheater } from '../core/Amphitheater';
import type { SpecimenMetadata } from '../core/Amphitheater';

describe('Amphitheater - Component Gallery', () => {
  describe('Initialization', () => {
    it('should create amphitheater with default configuration', () => {
      const amphitheater = new Amphitheater();
      expect(amphitheater).toBeDefined();
      expect(amphitheater.getTheme()).toBe('auto');
      expect(amphitheater.getLayout()).toBe('grid');
    });

    it('should create amphitheater with custom configuration', () => {
      const amphitheater = new Amphitheater({
        theme: 'dark',
        layout: 'list',
        search: false,
        keyboardNav: false,
      });

      expect(amphitheater.getTheme()).toBe('dark');
      expect(amphitheater.getLayout()).toBe('list');
    });

    it('should initialize successfully', async () => {
      const amphitheater = new Amphitheater();
      let initializedEmitted = false;

      amphitheater.on('initialized', () => {
        initializedEmitted = true;
      });

      await amphitheater.initialize();
      expect(initializedEmitted).toBe(true);
    });
  });

  describe('Specimen Registration', () => {
    it('should register a specimen', () => {
      const amphitheater = new Amphitheater();
      const specimen: SpecimenMetadata = {
        id: 'button-1',
        name: 'Primary Button',
        category: 'Buttons',
        tags: ['ui', 'interactive'],
        description: 'A primary action button',
      };

      let registeredEmitted = false;
      amphitheater.on('specimen:registered', (data) => {
        registeredEmitted = true;
        expect(data.metadata).toBe(specimen);
      });

      amphitheater.registerSpecimen(specimen);

      const retrieved = amphitheater.getSpecimen('button-1');
      expect(retrieved).toEqual(specimen);
      expect(registeredEmitted).toBe(true);
    });

    it('should auto-create category when registering specimen', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'card-1',
        name: 'Card',
        category: 'Cards',
        tags: ['layout'],
      });

      const categories = amphitheater.getCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0]!.id).toBe('Cards');
      expect(categories[0]!.specimens).toContain('card-1');
    });

    it('should unregister a specimen', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'remove-me',
        name: 'Remove Me',
        category: 'Test',
        tags: [],
      });

      expect(amphitheater.getSpecimen('remove-me')).toBeDefined();

      let unregisteredEmitted = false;
      amphitheater.on('specimen:unregistered', (data) => {
        unregisteredEmitted = true;
        expect(data.id).toBe('remove-me');
      });

      amphitheater.unregisterSpecimen('remove-me');

      expect(amphitheater.getSpecimen('remove-me')).toBeUndefined();
      expect(unregisteredEmitted).toBe(true);
    });

    it('should get all specimens', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'spec-1',
        name: 'Spec 1',
        category: 'Test',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'spec-2',
        name: 'Spec 2',
        category: 'Test',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'spec-3',
        name: 'Spec 3',
        category: 'Test',
        tags: [],
      });

      const specimens = amphitheater.getSpecimens();
      expect(specimens).toHaveLength(3);
    });
  });

  describe('Specimen Selection', () => {
    it('should select a specimen', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'select-me',
        name: 'Select Me',
        category: 'Test',
        tags: [],
      });

      let selectedEmitted = false;
      amphitheater.on('specimen:selected', (data) => {
        selectedEmitted = true;
        expect(data.id).toBe('select-me');
      });

      amphitheater.selectSpecimen('select-me');

      const selected = amphitheater.getSelectedSpecimen();
      expect(selected).not.toBeNull();
      expect(selected!.id).toBe('select-me');
      expect(selectedEmitted).toBe(true);
    });

    it('should throw error when selecting non-existent specimen', () => {
      const amphitheater = new Amphitheater();

      expect(() => {
        amphitheater.selectSpecimen('does-not-exist');
      }).toThrow('Specimen not found: does-not-exist');
    });

    it('should return null when no specimen selected', () => {
      const amphitheater = new Amphitheater();
      const selected = amphitheater.getSelectedSpecimen();
      expect(selected).toBeNull();
    });
  });

  describe('Category Management', () => {
    it('should get all categories', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'btn-1',
        name: 'Button',
        category: 'Buttons',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'card-1',
        name: 'Card',
        category: 'Cards',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'input-1',
        name: 'Input',
        category: 'Forms',
        tags: [],
      });

      const categories = amphitheater.getCategories();
      expect(categories).toHaveLength(3);
      expect(categories.map((c) => c.id)).toContain('Buttons');
      expect(categories.map((c) => c.id)).toContain('Cards');
      expect(categories.map((c) => c.id)).toContain('Forms');
    });

    it('should get specimens by category', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'btn-1',
        name: 'Primary Button',
        category: 'Buttons',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'btn-2',
        name: 'Secondary Button',
        category: 'Buttons',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'card-1',
        name: 'Card',
        category: 'Cards',
        tags: [],
      });

      const buttonSpecimens = amphitheater.getSpecimensByCategory('Buttons');
      expect(buttonSpecimens).toHaveLength(2);
      expect(buttonSpecimens[0]!.id).toBe('btn-1');
      expect(buttonSpecimens[1]!.id).toBe('btn-2');

      const cardSpecimens = amphitheater.getSpecimensByCategory('Cards');
      expect(cardSpecimens).toHaveLength(1);
      expect(cardSpecimens[0]!.id).toBe('card-1');
    });

    it('should return empty array for non-existent category', () => {
      const amphitheater = new Amphitheater();
      const specimens = amphitheater.getSpecimensByCategory('DoesNotExist');
      expect(specimens).toEqual([]);
    });
  });

  describe('Filtering and Search', () => {
    let amphitheater: Amphitheater;

    beforeEach(() => {
      amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'btn-primary',
        name: 'Primary Button',
        category: 'Buttons',
        tags: ['ui', 'interactive', 'primary'],
        description: 'Primary action button',
      });
      amphitheater.registerSpecimen({
        id: 'btn-secondary',
        name: 'Secondary Button',
        category: 'Buttons',
        tags: ['ui', 'interactive', 'secondary'],
        description: 'Secondary action button',
      });
      amphitheater.registerSpecimen({
        id: 'card-basic',
        name: 'Basic Card',
        category: 'Cards',
        tags: ['layout', 'container'],
        description: 'Basic card component',
      });
      amphitheater.registerSpecimen({
        id: 'input-text',
        name: 'Text Input',
        category: 'Forms',
        tags: ['form', 'input'],
        description: 'Text input field',
      });
    });

    it('should filter by category', () => {
      amphitheater.setFilter({ category: 'Buttons' });
      const filtered = amphitheater.getFilteredSpecimens();

      expect(filtered).toHaveLength(2);
      expect(filtered.map((s) => s.id)).toContain('btn-primary');
      expect(filtered.map((s) => s.id)).toContain('btn-secondary');
    });

    it('should filter by tags', () => {
      amphitheater.setFilter({ tags: ['primary'] });
      const filtered = amphitheater.getFilteredSpecimens();

      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.id).toBe('btn-primary');
    });

    it('should filter by multiple tags', () => {
      amphitheater.setFilter({ tags: ['ui', 'interactive'] });
      const filtered = amphitheater.getFilteredSpecimens();

      expect(filtered).toHaveLength(2);
      expect(filtered.map((s) => s.id)).toContain('btn-primary');
      expect(filtered.map((s) => s.id)).toContain('btn-secondary');
    });

    it('should search by query in name', () => {
      const results = amphitheater.search('Button');
      expect(results).toHaveLength(2);
      expect(results.map((s) => s.id)).toContain('btn-primary');
      expect(results.map((s) => s.id)).toContain('btn-secondary');
    });

    it('should search by query in description', () => {
      const results = amphitheater.search('card component');
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('card-basic');
    });

    it('should search by query in tags', () => {
      const results = amphitheater.search('form');
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('input-text');
    });

    it('should search case-insensitively', () => {
      const results = amphitheater.search('PRIMARY');
      expect(results).toHaveLength(1);
      expect(results[0]!.id).toBe('btn-primary');
    });

    it('should combine filters', () => {
      amphitheater.setFilter({
        category: 'Buttons',
        tags: ['primary'],
      });
      const filtered = amphitheater.getFilteredSpecimens();

      expect(filtered).toHaveLength(1);
      expect(filtered[0]!.id).toBe('btn-primary');
    });

    it('should emit filter:change event', () => {
      let eventEmitted = false;

      amphitheater.on('filter:change', (data) => {
        eventEmitted = true;
        expect(data.criteria.category).toBe('Buttons');
      });

      amphitheater.setFilter({ category: 'Buttons' });
      expect(eventEmitted).toBe(true);
    });

    it('should clear filters', () => {
      amphitheater.setFilter({ category: 'Buttons', tags: ['primary'] });
      let clearedEmitted = false;

      amphitheater.on('filter:clear', () => {
        clearedEmitted = true;
      });

      amphitheater.clearFilter();

      const filtered = amphitheater.getFilteredSpecimens();
      expect(filtered).toHaveLength(4); // All specimens
      expect(clearedEmitted).toBe(true);
    });
  });

  describe('Theme Management', () => {
    it('should set theme', () => {
      const amphitheater = new Amphitheater();
      let themeChangeEmitted = false;

      amphitheater.on('theme:change', (data) => {
        themeChangeEmitted = true;
        expect(data.theme).toBe('dark');
      });

      amphitheater.setTheme('dark');

      expect(amphitheater.getTheme()).toBe('dark');
      expect(themeChangeEmitted).toBe(true);
    });

    it('should toggle theme', () => {
      const amphitheater = new Amphitheater({ theme: 'light' });

      amphitheater.toggleTheme();
      expect(amphitheater.getTheme()).toBe('dark');

      amphitheater.toggleTheme();
      expect(amphitheater.getTheme()).toBe('light');
    });

    it('should not toggle auto theme', () => {
      const amphitheater = new Amphitheater({ theme: 'auto' });

      amphitheater.toggleTheme();
      expect(amphitheater.getTheme()).toBe('auto'); // Unchanged
    });
  });

  describe('Layout Management', () => {
    it('should set layout', () => {
      const amphitheater = new Amphitheater();
      let layoutChangeEmitted = false;

      amphitheater.on('layout:change', (data) => {
        layoutChangeEmitted = true;
        expect(data.layout).toBe('list');
      });

      amphitheater.setLayout('list');

      expect(amphitheater.getLayout()).toBe('list');
      expect(layoutChangeEmitted).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide statistics', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'spec-1',
        name: 'Spec 1',
        category: 'Cat1',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'spec-2',
        name: 'Spec 2',
        category: 'Cat2',
        tags: [],
      });

      amphitheater.selectSpecimen('spec-1');

      const stats = amphitheater.getStats();

      expect(stats.totalSpecimens).toBe(2);
      expect(stats.totalCategories).toBe(2);
      expect(stats.filteredCount).toBe(2);
      expect(stats.selectedSpecimen).toBe('spec-1');
    });

    it('should reflect filter in statistics', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'spec-1',
        name: 'Spec 1',
        category: 'Cat1',
        tags: [],
      });
      amphitheater.registerSpecimen({
        id: 'spec-2',
        name: 'Spec 2',
        category: 'Cat2',
        tags: [],
      });

      amphitheater.setFilter({ category: 'Cat1' });

      const stats = amphitheater.getStats();
      expect(stats.totalSpecimens).toBe(2);
      expect(stats.filteredCount).toBe(1);
    });
  });

  describe('Rendering', () => {
    it('should render amphitheater HTML', () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'btn-1',
        name: 'Button',
        category: 'Buttons',
        tags: ['ui'],
        description: 'A button component',
      });

      const html = amphitheater.render();

      expect(html).toContain('amphitheater');
      expect(html).toContain('Button');
      expect(html).toContain('A button component');
      expect(html).toContain('ui');
    });

    it('should render with current theme', () => {
      const amphitheater = new Amphitheater({ theme: 'dark' });
      const html = amphitheater.render();

      expect(html).toContain('amphitheater--dark');
    });

    it('should render with current layout', () => {
      const amphitheater = new Amphitheater({ layout: 'list' });
      const html = amphitheater.render();

      expect(html).toContain('amphitheater--list');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup amphitheater', async () => {
      const amphitheater = new Amphitheater();
      amphitheater.registerSpecimen({
        id: 'spec-1',
        name: 'Spec 1',
        category: 'Test',
        tags: [],
      });

      let cleanupEmitted = false;
      amphitheater.on('cleanup', () => {
        cleanupEmitted = true;
      });

      await amphitheater.cleanup();

      expect(cleanupEmitted).toBe(true);
      expect(amphitheater.getSpecimens()).toHaveLength(0);
      expect(amphitheater.getCategories()).toHaveLength(0);
    });
  });
});
