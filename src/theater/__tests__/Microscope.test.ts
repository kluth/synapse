import { Microscope, type MicroscopeLens, type InspectionResult } from '../instruments/Microscope';
import { SkinCell } from '../../ui/SkinCell';
import type { RenderSignal } from '../../ui/types';
import type { Input } from '../../types';

// Test component implementation
class TestVisualComponent extends SkinCell<{ name: string }> {
  protected override async executeProcessing<_TInput = unknown, TOutput = unknown>(
    _input: Input<_TInput>,
  ): Promise<TOutput> {
    return undefined as TOutput;
  }

  protected performRender(): RenderSignal {
    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          children: [this.receptiveField.name ?? 'Test'],
        },
        styles: {},
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now(),
        },
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}

describe('Microscope - Central Debugging Hub', () => {
  let microscope: Microscope;

  beforeEach(() => {
    microscope = new Microscope();
  });

  afterEach(async () => {
    await microscope.cleanup();
  });

  describe('Construction and Initialization', () => {
    it('should create microscope with default config', () => {
      expect(microscope).toBeDefined();
      expect(microscope.id).toBe('microscope');
      expect(microscope.name).toBe('Microscope');
    });

    it('should initialize with custom config', () => {
      const custom = new Microscope({
        defaultMode: 'performance',
        autoInspect: true,
        maxHistorySize: 50,
      });

      expect(custom.getMode()).toBe('performance');
    });

    it('should initialize all registered lenses', async () => {
      const mockLens = createMockLens('signals');
      microscope.registerLens(mockLens);

      await microscope.initialize();

      expect(mockLens.initialize).toHaveBeenCalled();
    });
  });

  describe('Lens Management', () => {
    it('should register a lens', () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      const registered = microscope.getLens('signals');
      expect(registered).toBe(lens);
    });

    it('should throw error when registering duplicate lens', () => {
      const lens1 = createMockLens('signals');
      const lens2 = createMockLens('signals');

      microscope.registerLens(lens1);

      expect(() => {
        microscope.registerLens(lens2);
      }).toThrow('Lens already registered for mode: signals');
    });

    it('should unregister a lens', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      await microscope.unregisterLens('signals');

      expect(microscope.getLens('signals')).toBeUndefined();
      expect(lens.cleanup).toHaveBeenCalled();
    });

    it('should get all lenses', () => {
      microscope.registerLens(createMockLens('signals'));
      microscope.registerLens(createMockLens('state'));

      const allLenses = microscope.getAllLenses();
      expect(allLenses.size).toBe(2);
    });
  });

  describe('Inspection Mode', () => {
    it('should set inspection mode', () => {
      microscope.registerLens(createMockLens('signals'));
      microscope.registerLens(createMockLens('performance'));

      microscope.setMode('performance');

      expect(microscope.getMode()).toBe('performance');
    });

    it('should throw error for invalid mode', () => {
      expect(() => {
        microscope.setMode('invalid' as 'signals');
      }).toThrow('No lens registered for mode: invalid');
    });

    it('should emit mode-changed event', () => {
      microscope.registerLens(createMockLens('signals'));
      microscope.registerLens(createMockLens('state'));

      let eventFired = false;
      microscope.on('mode-changed', () => {
        eventFired = true;
      });

      microscope.setMode('state');

      expect(eventFired).toBe(true);
    });
  });

  describe('Component Inspection', () => {
    it('should inspect a component', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });
      const result = await microscope.inspect(component);

      expect(result).toBeDefined();
      expect(result.mode).toBe('signals');
      expect(lens.inspect).toHaveBeenCalledWith(component);
    });

    it('should throw error when no lens available', async () => {
      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });

      await expect(microscope.inspect(component)).rejects.toThrow(
        'No lens available for mode: signals',
      );
    });

    it('should record inspection in history', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });
      await microscope.inspect(component);

      const history = microscope.getHistory();
      expect(history.length).toBe(1);
    });

    it('should emit inspection-complete event', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      let eventFired = false;
      microscope.on('inspection-complete', () => {
        eventFired = true;
      });

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });
      await microscope.inspect(component);

      expect(eventFired).toBe(true);
    });

    it('should store current component', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });
      await microscope.inspect(component);

      expect(microscope.getCurrentComponent()).toBe(component);
    });
  });

  describe('Inspection History', () => {
    it('should maintain inspection history', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });

      await microscope.inspect(component);
      await microscope.inspect(component);
      await microscope.inspect(component);

      const history = microscope.getHistory();
      expect(history.length).toBe(3);
    });

    it('should filter history by mode', async () => {
      microscope.registerLens(createMockLens('signals'));
      microscope.registerLens(createMockLens('state'));

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });

      await microscope.inspect(component);

      microscope.setMode('state');
      await microscope.inspect(component);

      const signalHistory = microscope.getHistoryForMode('signals');
      const stateHistory = microscope.getHistoryForMode('state');

      expect(signalHistory.length).toBe(1);
      expect(stateHistory.length).toBe(1);
    });

    it('should clear history', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });
      await microscope.inspect(component);

      microscope.clearHistory();

      expect(microscope.getHistory().length).toBe(0);
    });

    it('should limit history size', async () => {
      const limited = new Microscope({ maxHistorySize: 5 });
      const lens = createMockLens('signals');
      limited.registerLens(lens);

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });

      for (let i = 0; i < 10; i++) {
        await limited.inspect(component);
      }

      const history = limited.getHistory();
      expect(history.length).toBe(5);

      await limited.cleanup();
    });
  });

  describe('Real-time Updates', () => {
    it('should start real-time updates', () => {
      microscope.startRealTimeUpdates(100);

      expect(microscope.isRealTimeActive()).toBe(true);

      microscope.stopRealTimeUpdates();
    });

    it('should stop real-time updates', () => {
      microscope.startRealTimeUpdates(100);
      microscope.stopRealTimeUpdates();

      expect(microscope.isRealTimeActive()).toBe(false);
    });

    it('should not start if already active', () => {
      microscope.startRealTimeUpdates(100);
      microscope.startRealTimeUpdates(100);

      expect(microscope.isRealTimeActive()).toBe(true);

      microscope.stopRealTimeUpdates();
    });
  });

  describe('Data Export', () => {
    it('should export microscope data', async () => {
      microscope.registerLens(createMockLens('signals'));
      microscope.registerLens(createMockLens('state'));

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });
      await microscope.inspect(component);

      const exported = microscope.exportData();

      expect(exported.currentMode).toBe('signals');
      expect(exported.lenses).toContain('signals');
      expect(exported.lenses).toContain('state');
      expect(exported.history.length).toBe(1);
      expect(exported.stats.totalInspections).toBe(1);
    });
  });

  describe('Render', () => {
    it('should render microscope UI', () => {
      microscope.registerLens(createMockLens('signals'));

      const html = microscope.render();

      expect(html).toContain('microscope');
      expect(html).toContain('History');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all lenses', async () => {
      const lens1 = createMockLens('signals');
      const lens2 = createMockLens('state');

      microscope.registerLens(lens1);
      microscope.registerLens(lens2);

      await microscope.cleanup();

      expect(lens1.cleanup).toHaveBeenCalled();
      expect(lens2.cleanup).toHaveBeenCalled();
    });

    it('should clear history on cleanup', async () => {
      const lens = createMockLens('signals');
      microscope.registerLens(lens);

      const component = new TestVisualComponent({
        id: 'test-component',
        type: 'cortical',
        threshold: 0.5,
        props: { name: 'Test' },
      });
      await microscope.inspect(component);

      await microscope.cleanup();

      expect(microscope.getHistory().length).toBe(0);
    });

    it('should stop real-time updates on cleanup', async () => {
      microscope.startRealTimeUpdates(100);

      await microscope.cleanup();

      expect(microscope.isRealTimeActive()).toBe(false);
    });
  });
});

/**
 * Create a mock lens for testing
 */
function createMockLens(
  mode: 'signals' | 'state' | 'performance' | 'health' | 'structure',
): MicroscopeLens {
  return {
    id: `${mode}-lens`,
    name: `${mode} Lens`,
    mode: mode as 'signals',
    initialize: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
    inspect: jest.fn().mockResolvedValue({
      mode,
      timestamp: new Date(),
      data: {},
      issues: [],
    } as InspectionResult),
    render: jest.fn().mockReturnValue('<div>Mock Lens</div>'),
  };
}
