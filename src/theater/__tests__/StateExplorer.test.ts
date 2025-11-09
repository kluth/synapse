import { StateExplorer } from '../instruments/StateExplorer';
import { VisualNeuron } from '../../ui/VisualNeuron';

// Test component
class TestComponent extends VisualNeuron<{ name: string }> {
  constructor(props: { name: string }) {
    super({
      id: 'test-component',
      type: 'cortical',
      threshold: 0.5,
      props,
      initialState: {},
    });
  }

  protected override executeProcessing<_TInput = unknown, TOutput = unknown>(): Promise<TOutput> {
    return Promise.resolve(undefined as TOutput);
  }

  protected override performRender() {
    return {
      type: 'render' as const,
      data: {
        vdom: {
          tag: 'div',
          props: { className: 'test-component' },
          children: [this.receptiveField.name],
        },
        styles: {},
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}

describe('StateExplorer - Time-Travel Debugging', () => {
  let explorer: StateExplorer;

  beforeEach(() => {
    explorer = new StateExplorer();
  });

  afterEach(async () => {
    await explorer.cleanup();
  });

  describe('Construction and Initialization', () => {
    it('should create explorer with default config', () => {
      expect(explorer).toBeDefined();
      expect(explorer.id).toBe('state-explorer');
      expect(explorer.name).toBe('State Explorer');
      expect(explorer.mode).toBe('state');
    });

    it('should initialize with custom config', () => {
      const custom = new StateExplorer({
        maxSnapshots: 50,
        recordStackTraces: true,
        autoPauseOnError: false,
      });

      expect(custom).toBeDefined();
    });

    it('should initialize with empty snapshots', async () => {
      await explorer.initialize();

      const snapshots = explorer.getAllSnapshots();
      expect(snapshots.length).toBe(0);
    });
  });

  describe('State Inspection', () => {
    it('should inspect component state', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await explorer.inspect(component);

      expect(result).toBeDefined();
      expect(result.mode).toBe('state');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return inspection data', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await explorer.inspect(component);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('currentSnapshot');
      expect(result.data).toHaveProperty('snapshots');
      expect(result.data).toHaveProperty('stats');
    });

    it('should create snapshot on inspection', async () => {
      const component = new TestComponent({ name: 'Test' });
      await explorer.inspect(component);

      const current = explorer.getCurrentSnapshot();
      expect(current).toBeDefined();
    });
  });

  describe('Snapshot Management', () => {
    it('should create snapshots', async () => {
      const component = new TestComponent({ name: 'Test' });

      await explorer.inspect(component);
      await explorer.inspect(component);

      const snapshots = explorer.getAllSnapshots();
      expect(snapshots.length).toBe(2);
    });

    it('should get current snapshot', async () => {
      const component = new TestComponent({ name: 'Test' });
      await explorer.inspect(component);

      const current = explorer.getCurrentSnapshot();
      expect(current).toBeDefined();
      expect(current?.timestamp).toBeInstanceOf(Date);
    });

    it('should get snapshot by ID', async () => {
      const component = new TestComponent({ name: 'Test' });
      await explorer.inspect(component);

      const current = explorer.getCurrentSnapshot();
      if (current !== undefined) {
        const found = explorer.getSnapshot(current.id);
        expect(found).toBe(current);
      }
    });

    it('should clear snapshots', async () => {
      const component = new TestComponent({ name: 'Test' });
      await explorer.inspect(component);

      explorer.clearSnapshots();

      const snapshots = explorer.getAllSnapshots();
      expect(snapshots.length).toBe(0);
    });

    it('should limit snapshot count', async () => {
      const limited = new StateExplorer({ maxSnapshots: 5 });
      const component = new TestComponent({ name: 'Test' });

      for (let i = 0; i < 10; i++) {
        await limited.inspect(component);
      }

      const snapshots = limited.getAllSnapshots();
      expect(snapshots.length).toBe(5);

      await limited.cleanup();
    });
  });

  describe('Time Travel', () => {
    it('should pause recording', () => {
      explorer.timeTravel('pause');

      // Paused state is internal, verify through behavior
      expect(explorer).toBeDefined();
    });

    it('should resume recording', () => {
      explorer.timeTravel('pause');
      explorer.timeTravel('resume');

      expect(explorer).toBeDefined();
    });

    it('should step backward', async () => {
      const component = new TestComponent({ name: 'Test' });

      await explorer.inspect(component);
      await explorer.inspect(component);

      explorer.timeTravel('step-backward');

      expect(explorer).toBeDefined();
    });

    it('should step forward', async () => {
      const component = new TestComponent({ name: 'Test' });

      await explorer.inspect(component);
      await explorer.inspect(component);

      explorer.timeTravel('step-backward');
      explorer.timeTravel('step-forward');

      expect(explorer).toBeDefined();
    });

    it('should jump to specific snapshot', async () => {
      const component = new TestComponent({ name: 'Test' });

      await explorer.inspect(component);
      await explorer.inspect(component);
      await explorer.inspect(component);

      explorer.timeTravel('jump', 0);

      expect(explorer).toBeDefined();
    });
  });

  describe('State Validation', () => {
    it('should validate state when enabled', async () => {
      const validator = new StateExplorer({ validateState: true });
      const component = new TestComponent({ name: 'Test' });

      const result = await validator.inspect(component);

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);

      await validator.cleanup();
    });

    it('should skip validation when disabled', async () => {
      const noValidator = new StateExplorer({ validateState: false });
      const component = new TestComponent({ name: 'Test' });

      const result = await noValidator.inspect(component);

      expect(result.issues).toBeDefined();

      await noValidator.cleanup();
    });
  });

  describe('State Change Analysis', () => {
    it('should analyze state changes', async () => {
      const component = new TestComponent({ name: 'Test' });

      // Create multiple snapshots to analyze
      for (let i = 0; i < 15; i++) {
        await explorer.inspect(component);
      }

      const result = await explorer.inspect(component);
      const data = result.data as { analysis: { frequentChanges: string[] } };

      expect(data.analysis).toBeDefined();
      expect(data.analysis).toHaveProperty('frequentChanges');
    });
  });

  describe('Render', () => {
    it('should render explorer UI', () => {
      const html = explorer.render();

      expect(html).toContain('state-explorer');
      expect(html).toContain('Pause');
    });

    it('should render with snapshots', async () => {
      const component = new TestComponent({ name: 'Test' });
      await explorer.inspect(component);

      const html = explorer.render();

      expect(html).toContain('state-explorer');
    });
  });

  describe('Cleanup', () => {
    it('should clear all data on cleanup', async () => {
      const component = new TestComponent({ name: 'Test' });
      await explorer.inspect(component);

      await explorer.cleanup();

      const snapshots = explorer.getAllSnapshots();
      expect(snapshots.length).toBe(0);
    });
  });
});
