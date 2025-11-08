import { Specimen } from '../specimens/Specimen';

describe('Specimen - Component Showcase Wrapper', () => {
  describe('Construction', () => {
    it('should create a specimen with metadata', () => {
      const specimen = new Specimen(
        {
          id: 'button-1',
          name: 'Button',
          category: 'Buttons',
          tags: ['ui', 'interactive'],
          description: 'A button component',
        },
        () => document.createElement('button'),
      );

      expect(specimen.metadata.id).toBe('button-1');
      expect(specimen.metadata.name).toBe('Button');
      expect(specimen.metadata.category).toBe('Buttons');
      expect(specimen.metadata.tags).toEqual(['ui', 'interactive']);
    });

    it('should use default context values', () => {
      const specimen = new Specimen(
        {
          id: 'comp-1',
          name: 'Component',
          category: 'Test',
          tags: [],
        },
        (context) => {
          expect(context.interactive).toBe(true);
          expect(context.backgroundColor).toBe('#ffffff');
          expect(context.padding).toBe(16);
          return document.createElement('div');
        },
      );

      specimen.render();
    });

    it('should merge custom default context', () => {
      const specimen = new Specimen(
        {
          id: 'comp-1',
          name: 'Component',
          category: 'Test',
          tags: [],
        },
        (context) => {
          expect(context.backgroundColor).toBe('#f0f0f0');
          expect(context.padding).toBe(32);
          return document.createElement('div');
        },
        {
          backgroundColor: '#f0f0f0',
          padding: 32,
        },
      );

      specimen.render();
    });
  });

  describe('Rendering', () => {
    it('should render with default context', () => {
      const specimen = new Specimen(
        {
          id: 'test',
          name: 'Test',
          category: 'Test',
          tags: [],
        },
        () => {
          const button = document.createElement('button');
          button.textContent = 'Click me';
          return button;
        },
      );

      const element = specimen.render();
      expect(element).toBeInstanceOf(HTMLElement);
      expect((element as HTMLElement).tagName).toBe('BUTTON');
    });

    it('should render with custom context', () => {
      const specimen = new Specimen(
        {
          id: 'test',
          name: 'Test',
          category: 'Test',
          tags: [],
        },
        (context) => {
          const div = document.createElement('div');
          div.textContent = context.props!['label'] as string;
          return div;
        },
      );

      const element = specimen.render({
        props: { label: 'Custom Label' },
      });

      expect((element as HTMLElement).textContent).toBe('Custom Label');
    });

    it('should merge context props', () => {
      const specimen = new Specimen(
        {
          id: 'test',
          name: 'Test',
          category: 'Test',
          tags: [],
        },
        (context) => {
          const div = document.createElement('div');
          div.textContent = `${context.props!['foo']},${context.props!['bar']}`;
          return div;
        },
        {
          props: { foo: 'default' },
        },
      );

      const element = specimen.render({
        props: { bar: 'custom' },
      });

      expect((element as HTMLElement).textContent).toBe('default,custom');
    });
  });

  describe('Variations', () => {
    it('should add a variation', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        () => document.createElement('button'),
      );

      specimen.addVariation('primary', {
        props: { variant: 'primary' },
      });

      expect(specimen.hasVariation('primary')).toBe(true);
    });

    it('should remove a variation', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        () => document.createElement('button'),
      );

      specimen.addVariation('primary', {
        props: { variant: 'primary' },
      });

      const removed = specimen.removeVariation('primary');
      expect(removed).toBe(true);
      expect(specimen.hasVariation('primary')).toBe(false);
    });

    it('should get a variation', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        () => document.createElement('button'),
      );

      specimen.addVariation('primary', {
        props: { variant: 'primary' },
      });

      const variation = specimen.getVariation('primary');
      expect(variation).toBeDefined();
      expect(variation!.props).toEqual({ variant: 'primary' });
    });

    it('should get all variations', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        () => document.createElement('button'),
      );

      specimen.addVariation('primary', { props: { variant: 'primary' } });
      specimen.addVariation('secondary', { props: { variant: 'secondary' } });

      const variations = specimen.getVariations();
      expect(variations.size).toBe(2);
      expect(variations.has('primary')).toBe(true);
      expect(variations.has('secondary')).toBe(true);
    });

    it('should render a variation', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        (context) => {
          const button = document.createElement('button');
          button.className = context.props!['variant'] as string;
          return button;
        },
      );

      specimen.addVariation('primary', {
        props: { variant: 'btn-primary' },
      });

      const element = specimen.renderVariation('primary');
      expect((element as HTMLElement).className).toBe('btn-primary');
    });

    it('should throw error for non-existent variation', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        () => document.createElement('button'),
      );

      expect(() => {
        specimen.renderVariation('does-not-exist');
      }).toThrow('Variation not found: does-not-exist');
    });

    it('should render all variations', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        (context) => {
          const button = document.createElement('button');
          button.className = context.props!['variant'] as string;
          return button;
        },
      );

      specimen.addVariation('primary', { props: { variant: 'primary' } });
      specimen.addVariation('secondary', { props: { variant: 'secondary' } });
      specimen.addVariation('danger', { props: { variant: 'danger' } });

      const rendered = specimen.renderAllVariations();
      expect(rendered.size).toBe(3);
      expect((rendered.get('primary') as HTMLElement).className).toBe('primary');
      expect((rendered.get('secondary') as HTMLElement).className).toBe('secondary');
      expect((rendered.get('danger') as HTMLElement).className).toBe('danger');
    });

    it('should support fluent API for variations', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        () => document.createElement('button'),
      )
        .addVariation('primary', { props: { variant: 'primary' } })
        .addVariation('secondary', { props: { variant: 'secondary' } });

      expect(specimen.hasVariation('primary')).toBe(true);
      expect(specimen.hasVariation('secondary')).toBe(true);
    });
  });

  describe('Metadata Management', () => {
    it('should update metadata', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: [],
        },
        () => document.createElement('button'),
      );

      specimen.updateMetadata({
        description: 'Updated description',
        version: '2.0.0',
      });

      expect(specimen.metadata.description).toBe('Updated description');
      expect(specimen.metadata.version).toBe('2.0.0');
      expect(specimen.metadata.updatedAt).toBeInstanceOf(Date);
    });

    it('should preserve existing metadata when updating', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: ['ui'],
        },
        () => document.createElement('button'),
      );

      specimen.updateMetadata({
        description: 'New description',
      });

      expect(specimen.metadata.id).toBe('button');
      expect(specimen.metadata.name).toBe('Button');
      expect(specimen.metadata.tags).toEqual(['ui']);
    });
  });

  describe('Context Management', () => {
    it('should update default context', () => {
      const specimen = new Specimen(
        {
          id: 'test',
          name: 'Test',
          category: 'Test',
          tags: [],
        },
        (context) => {
          const div = document.createElement('div');
          div.style.padding = `${context.padding}px`;
          return div;
        },
      );

      specimen.updateDefaultContext({
        padding: 24,
      });

      const element = specimen.render();
      expect((element as HTMLElement).style.padding).toBe('24px');
    });
  });

  describe('Cloning', () => {
    it('should clone specimen with new metadata', () => {
      const specimen = new Specimen(
        {
          id: 'button-1',
          name: 'Button',
          category: 'Buttons',
          tags: ['ui'],
        },
        () => document.createElement('button'),
      );

      specimen.addVariation('primary', { props: { variant: 'primary' } });

      const cloned = specimen.clone({
        id: 'button-2',
        name: 'Button Clone',
      });

      expect(cloned.metadata.id).toBe('button-2');
      expect(cloned.metadata.name).toBe('Button Clone');
      expect(cloned.metadata.category).toBe('Buttons'); // Preserved
      expect(cloned.hasVariation('primary')).toBe(true);
    });
  });

  describe('Export', () => {
    it('should export specimen definition', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: ['ui'],
        },
        () => document.createElement('button'),
        {
          backgroundColor: '#f0f0f0',
        },
      );

      specimen.addVariation('primary', { props: { variant: 'primary' } });
      specimen.addVariation('secondary', { props: { variant: 'secondary' } });

      const exported = specimen.export();

      expect(exported.metadata.id).toBe('button');
      expect(exported.defaultContext.backgroundColor).toBe('#f0f0f0');
      expect(exported.variations['primary']).toBeDefined();
      expect(exported.variations['secondary']).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should provide specimen statistics', () => {
      const specimen = new Specimen(
        {
          id: 'button',
          name: 'Button',
          category: 'Buttons',
          tags: ['ui', 'interactive'],
          description: 'A button component',
        },
        () => document.createElement('button'),
      );

      specimen.addVariation('primary', { props: { variant: 'primary' } });
      specimen.addVariation('secondary', { props: { variant: 'secondary' } });

      const stats = specimen.getStats();

      expect(stats.variationCount).toBe(2);
      expect(stats.hasDescription).toBe(true);
      expect(stats.tagCount).toBe(2);
    });
  });
});
