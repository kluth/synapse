import { PerformanceProfiler } from '../instruments/PerformanceProfiler';
import { VisualNeuron } from '../../ui/VisualNeuron';

describe('PerformanceProfiler - Performance Monitoring', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
  });

  afterEach(async () => {
    await profiler.cleanup();
  });

  describe('Construction and Initialization', () => {
    it('should create profiler with default config', () => {
      expect(profiler).toBeDefined();
      expect(profiler.id).toBe('performance-profiler');
      expect(profiler.name).toBe('Performance Profiler');
      expect(profiler.mode).toBe('performance');
    });

    it('should initialize with custom config', () => {
      const custom = new PerformanceProfiler({
        slowRenderThreshold: 32,
        excessiveRenderThreshold: 50,
        trackMemory: false,
      });

      expect(custom).toBeDefined();
    });

    it('should initialize and clear profiles', async () => {
      await profiler.initialize();

      const profiles = profiler.getAllProfiles();
      expect(profiles.length).toBe(0);
    });
  });

  describe('Performance Inspection', () => {
    it('should inspect component performance', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      const result = await profiler.inspect(component);

      expect(result).toBeDefined();
      expect(result.mode).toBe('performance');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return inspection data', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      const result = await profiler.inspect(component);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('profile');
      expect(result.data).toHaveProperty('metrics');
      expect(result.data).toHaveProperty('score');
    });

    it('should include performance metrics', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      const result = await profiler.inspect(component);

      const data = result.data as { metrics: unknown[] };
      expect(Array.isArray(data.metrics)).toBe(true);
    });
  });

  describe('Render Profiling', () => {
    it('should create render profile', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      await profiler.inspect(component);

      const profiles = profiler.getAllProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should track render count', async () => {
      const component = new VisualNeuron({ name: 'Test' });

      await profiler.inspect(component);
      await profiler.inspect(component);

      const profiles = profiler.getAllProfiles();
      const profile = profiles[0];

      if (profile !== undefined) {
        expect(profile.renderCount).toBeGreaterThan(0);
      }
    });

    it('should calculate average render time', async () => {
      const component = new VisualNeuron({ name: 'Test' });

      await profiler.inspect(component);
      await profiler.inspect(component);

      const profiles = profiler.getAllProfiles();
      const profile = profiles[0];

      if (profile !== undefined) {
        expect(profile.avgRenderTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Bottleneck Detection', () => {
    it('should detect performance bottlenecks', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      const result = await profiler.inspect(component);

      const data = result.data as { bottlenecks: unknown[] };
      expect(Array.isArray(data.bottlenecks)).toBe(true);
    });

    it('should detect slow renders', async () => {
      const slowProfiler = new PerformanceProfiler({ slowRenderThreshold: 1 });
      const component = new VisualNeuron({ name: 'Test' });

      const result = await slowProfiler.inspect(component);
      const data = result.data as { bottlenecks: unknown[] };

      expect(data.bottlenecks).toBeDefined();

      await slowProfiler.cleanup();
    });
  });

  describe('Performance Score', () => {
    it('should calculate performance score', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      const result = await profiler.inspect(component);

      const data = result.data as { score: number };
      expect(typeof data.score).toBe('number');
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Profile Management', () => {
    it('should get all profiles', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      await profiler.inspect(component);

      const profiles = profiler.getAllProfiles();
      expect(Array.isArray(profiles)).toBe(true);
    });

    it('should clear profiles and metrics', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      await profiler.inspect(component);

      profiler.clear();

      const profiles = profiler.getAllProfiles();
      const metrics = profiler.getAllMetrics();

      expect(profiles.length).toBe(0);
      expect(metrics.length).toBe(0);
    });
  });

  describe('Metrics Collection', () => {
    it('should collect performance metrics', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      await profiler.inspect(component);

      const metrics = profiler.getAllMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should track FPS', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      const result = await profiler.inspect(component);

      const data = result.data as { stats: { fps: number } };
      expect(typeof data.stats.fps).toBe('number');
    });
  });

  describe('Render', () => {
    it('should render profiler UI', () => {
      const html = profiler.render();

      expect(html).toContain('performance-profiler');
      expect(html).toContain('FPS');
    });

    it('should render with profiles', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      await profiler.inspect(component);

      const html = profiler.render();

      expect(html).toContain('performance-profiler');
    });
  });

  describe('Cleanup', () => {
    it('should clear all data on cleanup', async () => {
      const component = new VisualNeuron({ name: 'Test' });
      await profiler.inspect(component);

      await profiler.cleanup();

      const profiles = profiler.getAllProfiles();
      const metrics = profiler.getAllMetrics();

      expect(profiles.length).toBe(0);
      expect(metrics.length).toBe(0);
    });
  });
});
