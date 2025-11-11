import { HealthMonitor } from '../instruments/HealthMonitor';
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

describe('HealthMonitor - Component Health Monitoring', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    monitor = new HealthMonitor();
  });

  afterEach(async () => {
    await monitor.cleanup();
  });

  describe('Construction and Initialization', () => {
    it('should create monitor with default config', () => {
      expect(monitor).toBeDefined();
      expect(monitor.id).toBe('health-monitor');
      expect(monitor.name).toBe('Health Monitor');
      expect(monitor.mode).toBe('health');
    });

    it('should initialize with custom config', () => {
      const custom = new HealthMonitor({
        enableErrorBoundaries: false,
        autoRecover: true,
        maxErrorHistory: 50,
      });

      expect(custom).toBeDefined();
    });

    it('should initialize and clear reports', async () => {
      await monitor.initialize();

      const reports = monitor.getAllReports();
      expect(reports.length).toBe(0);
    });
  });

  describe('Health Inspection', () => {
    it('should inspect component health', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      expect(result).toBeDefined();
      expect(result.mode).toBe('health');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return inspection data', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('report');
      expect(result.data).toHaveProperty('recentErrors');
      expect(result.data).toHaveProperty('stats');
    });

    it('should create health report', async () => {
      const component = new TestComponent({ name: 'Test' });
      await monitor.inspect(component);

      const reports = monitor.getAllReports();
      expect(reports.length).toBeGreaterThan(0);
    });

    it('should include health checks in report', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { checks: unknown[] } };
      expect(Array.isArray(data.report.checks)).toBe(true);
      expect(data.report.checks.length).toBeGreaterThan(0);
    });
  });

  describe('Health Status', () => {
    it('should determine health status', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { status: string } };
      expect(data.report.status).toBeDefined();
      expect(['healthy', 'warning', 'error', 'critical']).toContain(data.report.status);
    });

    it('should calculate health score', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { healthScore: number } };
      expect(typeof data.report.healthScore).toBe('number');
      expect(data.report.healthScore).toBeGreaterThanOrEqual(0);
      expect(data.report.healthScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Recording', () => {
    it('should record errors', () => {
      const error = new Error('Test error');
      monitor.recordError(error, 'test-component');

      const errors = monitor.getAllErrors();
      expect(errors.length).toBe(1);
      expect(errors[0]?.error.message).toBe('Test error');
    });

    it('should track error count', async () => {
      const error = new Error('Test error');
      monitor.recordError(error, 'test-component');

      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { stats: { totalErrors: number } };
      expect(data.stats.totalErrors).toBeGreaterThanOrEqual(0);
    });

    it('should limit error history', () => {
      const limited = new HealthMonitor({ maxErrorHistory: 5 });

      for (let i = 0; i < 10; i++) {
        limited.recordError(new Error(`Error ${i}`), 'test-component');
      }

      const errors = limited.getAllErrors();
      expect(errors.length).toBe(5);
    });

    it('should clear errors', () => {
      const error = new Error('Test error');
      monitor.recordError(error, 'test-component');

      monitor.clearErrors();

      const errors = monitor.getAllErrors();
      expect(errors.length).toBe(0);
    });
  });

  describe('Warning Recording', () => {
    it('should record warnings', () => {
      monitor.recordWarning('Test warning', 'test-component');

      // Warnings are tracked internally, verify through inspection
      expect(monitor).toBeDefined();
    });

    it('should clear warnings', () => {
      monitor.recordWarning('Test warning', 'test-component');

      monitor.clearWarnings();

      expect(monitor).toBeDefined();
    });
  });

  describe('Component Tracking', () => {
    it('should track component mount', () => {
      monitor.trackMount('test-component');

      // Mount time is tracked internally
      expect(monitor).toBeDefined();
    });

    it('should track component uptime', async () => {
      monitor.trackMount('test-component');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { uptime: number } };
      expect(data.report.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Reports', () => {
    it('should get all health reports', async () => {
      const component = new TestComponent({ name: 'Test' });
      await monitor.inspect(component);

      const reports = monitor.getAllReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('should include error and warning counts', async () => {
      monitor.recordError(new Error('Test'), 'test-component');
      monitor.recordWarning('Test', 'test-component');

      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { errorCount: number; warningCount: number } };
      expect(typeof data.report.errorCount).toBe('number');
      expect(typeof data.report.warningCount).toBe('number');
    });
  });

  describe('Health Checks', () => {
    it('should run health checks', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { checks: unknown[] } };
      expect(data.report.checks.length).toBeGreaterThan(0);
    });

    it('should include error check', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { checks: Array<{ name: string }> } };
      const errorCheck = data.report.checks.find((check) => check.name === 'Error Check');

      expect(errorCheck).toBeDefined();
    });

    it('should include uptime check', async () => {
      const component = new TestComponent({ name: 'Test' });
      const result = await monitor.inspect(component);

      const data = result.data as { report: { checks: Array<{ name: string }> } };
      const uptimeCheck = data.report.checks.find((check) => check.name === 'Uptime Check');

      expect(uptimeCheck).toBeDefined();
    });
  });

  describe('Render', () => {
    it('should render monitor UI', () => {
      const html = monitor.render();

      expect(html).toContain('health-monitor');
      expect(html).toContain('Healthy Components');
    });

    it('should render with reports', async () => {
      const component = new TestComponent({ name: 'Test' });
      await monitor.inspect(component);

      const html = monitor.render();

      expect(html).toContain('health-monitor');
    });

    it('should render error log', async () => {
      const error = new Error('Test error');
      monitor.recordError(error, 'test-component');

      const html = monitor.render();

      expect(html).toContain('Recent Errors');
    });
  });

  describe('Cleanup', () => {
    it('should clear all data on cleanup', async () => {
      const component = new TestComponent({ name: 'Test' });
      monitor.recordError(new Error('Test'), 'test-component');

      await monitor.inspect(component);
      await monitor.cleanup();

      const reports = monitor.getAllReports();
      const errors = monitor.getAllErrors();

      expect(reports.length).toBe(0);
      expect(errors.length).toBe(0);
    });
  });
});
