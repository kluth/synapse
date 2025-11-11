import { SignalTracer } from '../instruments/SignalTracer';
import { SkinCell } from '../../ui/SkinCell';

// Test component
class TestComponent extends SkinCell<{ name: string }> {
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

describe('SignalTracer - Neural Signal Visualization', () => {
  let tracer: SignalTracer;

  beforeEach(() => {
    tracer = new SignalTracer();
  });

  afterEach(async () => {
    await tracer.cleanup();
  });

  describe('Construction and Initialization', () => {
    it('should create tracer with default config', () => {
      expect(tracer).toBeDefined();
      expect(tracer.id).toBe('signal-tracer');
      expect(tracer.name).toBe('Signal Tracer');
      expect(tracer.mode).toBe('signals');
    });

    it('should initialize with custom config', () => {
      const custom = new SignalTracer({
        maxTraces: 50,
        trackHistory: false,
        detectCircular: false,
      });

      expect(custom).toBeDefined();
    });

    it('should initialize and clear traces', async () => {
      await tracer.initialize();

      const traces = tracer.getAllTraces();
      expect(traces.length).toBe(0);
    });
  });

  describe('Signal Inspection', () => {
    it('should inspect component signals', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await tracer.inspect(component);

      expect(result).toBeDefined();
      expect(result.mode).toBe('signals');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return inspection data', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await tracer.inspect(component);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('signals');
      expect(result.data).toHaveProperty('flowGraph');
      expect(result.data).toHaveProperty('stats');
    });

    it('should include flow graph in result', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await tracer.inspect(component);

      const flowGraph = (result.data as { flowGraph: { nodes: unknown[]; edges: unknown[] } })
        .flowGraph;
      expect(flowGraph).toBeDefined();
      expect(flowGraph).toHaveProperty('nodes');
      expect(flowGraph).toHaveProperty('edges');
    });
  });

  describe('Signal Traces', () => {
    it('should get all traces', async () => {
      const component = new TestComponent({ name: 'Test' });
      await tracer.inspect(component);

      const traces = tracer.getAllTraces();
      expect(Array.isArray(traces)).toBe(true);
    });

    it('should clear traces', async () => {
      const component = new TestComponent({ name: 'Test' });
      await tracer.inspect(component);

      tracer.clearTraces();

      const traces = tracer.getAllTraces();
      expect(traces.length).toBe(0);
    });
  });

  describe('Signal History', () => {
    it('should track signal history when enabled', async () => {
      const trackerWithHistory = new SignalTracer({ trackHistory: true });
      const component = new TestComponent({ name: 'Test' });

      await trackerWithHistory.inspect(component);

      const history = trackerWithHistory.getHistory();
      expect(Array.isArray(history)).toBe(true);

      await trackerWithHistory.cleanup();
    });

    it('should get history for specific signal', async () => {
      const component = new TestComponent({ name: 'Test' });
      await tracer.inspect(component);

      const history = tracer.getHistory('signal-id');
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect circular dependencies when enabled', async () => {
      const detector = new SignalTracer({ detectCircular: true });
      const component = new TestComponent({ name: 'Test' });

      const result = await detector.inspect(component);

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);

      await detector.cleanup();
    });

    it('should not detect circular dependencies when disabled', async () => {
      const noDetector = new SignalTracer({ detectCircular: false });
      const component = new TestComponent({ name: 'Test' });

      const result = await noDetector.inspect(component);

      expect(result.issues).toBeDefined();

      await noDetector.cleanup();
    });
  });

  describe('Slow Signal Detection', () => {
    it('should detect slow signals', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await tracer.inspect(component);

      expect(result.issues).toBeDefined();
    });
  });

  describe('Flow Graph', () => {
    it('should build signal flow graph', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await tracer.inspect(component);

      const data = result.data as { flowGraph: { nodes: unknown[]; edges: unknown[] } };
      const flowGraph = data.flowGraph;

      expect(flowGraph).toBeDefined();
      expect(Array.isArray(flowGraph.nodes)).toBe(true);
      expect(Array.isArray(flowGraph.edges)).toBe(true);
    });
  });

  describe('Render', () => {
    it('should render tracer UI', () => {
      const html = tracer.render();

      expect(html).toContain('signal-tracer');
      expect(html).toContain('Active Signals');
    });
  });

  describe('Cleanup', () => {
    it('should clear all data on cleanup', async () => {
      const component = new TestComponent({ name: 'Test' });
      await tracer.inspect(component);

      await tracer.cleanup();

      const traces = tracer.getAllTraces();
      expect(traces.length).toBe(0);
    });
  });
});
