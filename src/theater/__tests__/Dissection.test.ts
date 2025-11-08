import { Dissection, DissectionBuilder, createDissection } from '../specimens/Dissection';

describe('Dissection - Component Structure Explorer', () => {
  describe('Construction', () => {
    it('should create dissection with structure', () => {
      const dissection = createDissection('Button', [
        {
          name: 'label',
          type: 'string',
          description: 'Button label',
          defaultValue: 'Click me',
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: false,
        },
      ]);

      const structure = dissection.getStructure();
      expect(structure.name).toBe('Button');
      expect(structure.props.size).toBe(2);
    });

    it('should initialize default prop values', () => {
      const dissection = createDissection('Button', [
        {
          name: 'label',
          type: 'string',
          defaultValue: 'Click me',
        },
      ]);

      expect(dissection.getPropValue('label')).toBe('Click me');
    });
  });

  describe('Prop Definitions', () => {
    it('should get prop definition', () => {
      const dissection = createDissection('Button', [
        {
          name: 'size',
          type: 'enum',
          options: ['small', 'medium', 'large'],
          defaultValue: 'medium',
        },
      ]);

      const def = dissection.getPropDefinition('size');
      expect(def).toBeDefined();
      expect(def!.type).toBe('enum');
      expect(def!.options).toEqual(['small', 'medium', 'large']);
    });

    it('should get all props', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string' },
        { name: 'disabled', type: 'boolean' },
        { name: 'size', type: 'string' },
      ]);

      const allProps = dissection.getAllProps();
      expect(allProps.size).toBe(3);
    });
  });

  describe('Prop Values', () => {
    it('should set prop value', () => {
      const dissection = createDissection('Button', [{ name: 'label', type: 'string' }]);

      dissection.setPropValue('label', 'New Label');
      expect(dissection.getPropValue('label')).toBe('New Label');
    });

    it('should throw error for invalid prop', () => {
      const dissection = createDissection('Button', []);

      expect(() => {
        dissection.setPropValue('invalid', 'value');
      }).toThrow('Prop not found: invalid');
    });

    it('should validate prop values', () => {
      const dissection = createDissection('Button', [
        {
          name: 'size',
          type: 'number',
          validate: (val) => typeof val === 'number' && val > 0,
        },
      ]);

      dissection.setPropValue('size', 10);
      expect(() => {
        dissection.setPropValue('size', -5);
      }).toThrow('Invalid value for prop: size');
    });

    it('should get all prop values', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', defaultValue: 'Click' },
        { name: 'disabled', type: 'boolean', defaultValue: false },
      ]);

      dissection.setPropValue('label', 'Submit');

      const values = dissection.getAllPropValues();
      expect(values).toEqual({
        label: 'Submit',
        disabled: false,
      });
    });
  });

  describe('Prop Reset', () => {
    it('should reset prop to default', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', defaultValue: 'Click' },
      ]);

      dissection.setPropValue('label', 'Custom');
      dissection.resetProp('label');

      expect(dissection.getPropValue('label')).toBe('Click');
    });

    it('should reset all props', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', defaultValue: 'Click' },
        { name: 'size', type: 'string', defaultValue: 'medium' },
      ]);

      dissection.setPropValue('label', 'Custom');
      dissection.setPropValue('size', 'large');
      dissection.resetAllProps();

      expect(dissection.getPropValue('label')).toBe('Click');
      expect(dissection.getPropValue('size')).toBe('medium');
    });
  });

  describe('Prop Change Listeners', () => {
    it('should notify listeners on prop change', () => {
      const dissection = createDissection('Button', [{ name: 'label', type: 'string' }]);

      let notified = false;
      let notifiedProp = '';
      let notifiedValue: unknown;

      dissection.onPropChange((prop, value) => {
        notified = true;
        notifiedProp = prop;
        notifiedValue = value;
      });

      dissection.setPropValue('label', 'Test');

      expect(notified).toBe(true);
      expect(notifiedProp).toBe('label');
      expect(notifiedValue).toBe('Test');
    });

    it('should unsubscribe listener', () => {
      const dissection = createDissection('Button', [{ name: 'label', type: 'string' }]);

      let notified = 0;
      const unsubscribe = dissection.onPropChange(() => {
        notified++;
      });

      dissection.setPropValue('label', 'Test1');
      unsubscribe();
      dissection.setPropValue('label', 'Test2');

      expect(notified).toBe(1);
    });
  });

  describe('Prop Filtering', () => {
    it('should get required props', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', required: true },
        { name: 'disabled', type: 'boolean', required: false },
      ]);

      const required = dissection.getRequiredProps();
      expect(required.size).toBe(1);
      expect(required.has('label')).toBe(true);
    });

    it('should get optional props', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', required: true },
        { name: 'disabled', type: 'boolean', required: false },
        { name: 'size', type: 'string' },
      ]);

      const optional = dissection.getOptionalProps();
      expect(optional.size).toBe(2);
      expect(optional.has('disabled')).toBe(true);
      expect(optional.has('size')).toBe(true);
    });

    it('should get props by type', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string' },
        { name: 'count', type: 'number' },
        { name: 'disabled', type: 'boolean' },
        { name: 'variant', type: 'string' },
      ]);

      const stringProps = dissection.getPropsByType('string');
      expect(stringProps.size).toBe(2);
      expect(stringProps.has('label')).toBe(true);
      expect(stringProps.has('variant')).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate all props successfully', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', required: true },
        { name: 'disabled', type: 'boolean' },
      ]);

      dissection.setPropValue('label', 'Click');

      const result = dissection.validateAllProps();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing required props', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', required: true },
      ]);

      const result = dissection.validateAllProps();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Required prop missing: label');
    });

    it('should detect invalid prop values', () => {
      const dissection = createDissection('Button', [
        {
          name: 'size',
          type: 'number',
          validate: (val) => typeof val === 'number' && val > 0,
        },
      ]);

      // setPropValue should throw when validation fails
      expect(() => {
        dissection.setPropValue('size', -5);
      }).toThrow('Invalid value for prop: size');
    });
  });

  describe('Methods and Events', () => {
    it('should get methods', () => {
      const dissection = new DissectionBuilder()
        .withName('Button')
        .addMethod('click', 'Triggers click event')
        .addMethod('focus', 'Focuses the button')
        .build();

      const methods = dissection.getMethods();
      expect(methods.size).toBe(2);
      expect(methods.get('click')).toBe('Triggers click event');
    });

    it('should get events', () => {
      const dissection = new DissectionBuilder()
        .withName('Button')
        .addEvent('onClick', 'Emitted on click')
        .addEvent('onFocus', 'Emitted on focus')
        .build();

      const events = dissection.getEvents();
      expect(events.size).toBe(2);
      expect(events.get('onClick')).toBe('Emitted on click');
    });
  });

  describe('Export', () => {
    it('should export dissection data', () => {
      const dissection = createDissection('Button', [
        { name: 'label', type: 'string', defaultValue: 'Click' },
      ]);

      dissection.setPropValue('label', 'Submit');

      const exported = dissection.export();
      expect(exported.structure.name).toBe('Button');
      expect(exported.currentValues).toEqual({ label: 'Submit' });
      expect(exported.validation.valid).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide statistics', () => {
      const dissection = new DissectionBuilder()
        .withName('Button')
        .addProp({ name: 'label', type: 'string', required: true })
        .addProp({ name: 'disabled', type: 'boolean' })
        .addProp({ name: 'size', type: 'string' })
        .addMethod('click', 'Click handler')
        .addEvent('onClick', 'Click event')
        .build();

      const stats = dissection.getStats();
      expect(stats.totalProps).toBe(3);
      expect(stats.requiredProps).toBe(1);
      expect(stats.optionalProps).toBe(2);
      expect(stats.methodsCount).toBe(1);
      expect(stats.eventsCount).toBe(1);
    });
  });

  describe('Builder', () => {
    it('should build dissection with fluent API', () => {
      const dissection = new DissectionBuilder()
        .withName('Button')
        .addProp({ name: 'label', type: 'string' })
        .addProp({ name: 'disabled', type: 'boolean' })
        .addMethod('click', 'Triggers click')
        .addEvent('onClick', 'Click event')
        .build();

      expect(dissection.getStructure().name).toBe('Button');
      expect(dissection.getAllProps().size).toBe(2);
      expect(dissection.getMethods().size).toBe(1);
      expect(dissection.getEvents().size).toBe(1);
    });

    it('should throw error without name', () => {
      const builder = new DissectionBuilder().addProp({ name: 'test', type: 'string' });

      expect(() => builder.build()).toThrow('Component name is required');
    });
  });
});
