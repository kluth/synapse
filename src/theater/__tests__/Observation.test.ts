import { Observation, ObservationBuilder, createObservations } from '../specimens/Observation';

describe('Observation - Component Variation', () => {
  describe('Construction', () => {
    it('should create observation with config', () => {
      const obs = new Observation({
        name: 'Primary',
        description: 'Primary button state',
        props: { variant: 'primary' },
        tags: ['button', 'primary'],
      });

      expect(obs.name).toBe('Primary');
      expect(obs.description).toBe('Primary button state');
      expect(obs.props).toEqual({ variant: 'primary' });
      expect(obs.tags).toEqual(['button', 'primary']);
    });

    it('should use default empty values', () => {
      const obs = new Observation({ name: 'Test' });

      expect(obs.props).toEqual({});
      expect(obs.state).toEqual({});
      expect(obs.tags).toEqual([]);
    });
  });

  describe('Lifecycle', () => {
    it('should initialize observation', async () => {
      let setupCalled = false;
      const obs = new Observation({
        name: 'Test',
        setup: () => {
          setupCalled = true;
        },
      });

      await obs.initialize();
      expect(setupCalled).toBe(true);
    });

    it('should not initialize twice', async () => {
      let setupCount = 0;
      const obs = new Observation({
        name: 'Test',
        setup: () => {
          setupCount++;
        },
      });

      await obs.initialize();
      await obs.initialize();
      expect(setupCount).toBe(1);
    });

    it('should cleanup observation', async () => {
      let teardownCalled = false;
      const obs = new Observation({
        name: 'Test',
        teardown: () => {
          teardownCalled = true;
        },
      });

      await obs.cleanup();
      expect(teardownCalled).toBe(true);
    });
  });

  describe('Context', () => {
    it('should get specimen context', () => {
      const obs = new Observation({
        name: 'Test',
        props: { foo: 'bar' },
        state: { count: 0 },
        context: { backgroundColor: '#fff' },
      });

      const context = obs.getSpecimenContext();
      expect(context.props).toEqual({ foo: 'bar' });
      expect(context.state).toEqual({ count: 0 });
      expect(context.backgroundColor).toBe('#fff');
    });
  });

  describe('Play Function', () => {
    it('should run play function', async () => {
      let playCalled = false;
      const obs = new Observation({
        name: 'Test',
        play: () => {
          playCalled = true;
        },
      });

      const element = document.createElement('div');
      await obs.runPlay(element);
      expect(playCalled).toBe(true);
    });

    it('should check if has play', () => {
      const obs1 = new Observation({
        name: 'Test1',
        play: () => {},
      });

      const obs2 = new Observation({
        name: 'Test2',
      });

      expect(obs1.hasPlay()).toBe(true);
      expect(obs2.hasPlay()).toBe(false);
    });
  });

  describe('Export', () => {
    it('should export observation', () => {
      const obs = new Observation({
        name: 'Primary',
        description: 'Primary button',
        props: { variant: 'primary' },
        tags: ['primary'],
      });

      const exported = obs.export();
      expect(exported.name).toBe('Primary');
      expect(exported.description).toBe('Primary button');
      expect(exported.props).toEqual({ variant: 'primary' });
      expect(exported.tags).toEqual(['primary']);
    });
  });

  describe('Builder', () => {
    it('should build observation with fluent API', () => {
      const obs = new ObservationBuilder()
        .withName('Test')
        .withDescription('Test observation')
        .withProps({ foo: 'bar' })
        .withTags('test', 'example')
        .build();

      expect(obs.name).toBe('Test');
      expect(obs.description).toBe('Test observation');
      expect(obs.props).toEqual({ foo: 'bar' });
      expect(obs.tags).toEqual(['test', 'example']);
    });

    it('should throw error without name', () => {
      const builder = new ObservationBuilder().withDescription('No name');

      expect(() => builder.build()).toThrow('Observation name is required');
    });
  });

  describe('createObservations', () => {
    it('should create multiple observations from config', () => {
      const observations = createObservations({
        primary: {
          name: 'Primary',
          props: { variant: 'primary' },
        },
        secondary: {
          name: 'Secondary',
          props: { variant: 'secondary' },
        },
      });

      expect(observations.size).toBe(2);
      expect(observations.get('primary')!.name).toBe('Primary');
      expect(observations.get('secondary')!.name).toBe('Secondary');
    });
  });
});
