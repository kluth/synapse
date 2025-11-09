import { Microglia } from './Microglia';

describe('Microglia - Health Monitoring and Observability', () => {
  let microglia: Microglia;

  beforeEach(() => {
    microglia = new Microglia({
      id: 'micro-1',
      healthCheckInterval: 100,
      alertThreshold: 3,
    });
  });

  afterEach(async () => {
    await microglia.shutdown();
  });

  describe('initialization', () => {
    it('should create a microglia with correct properties', () => {
      expect(microglia.id).toBe('micro-1');
      expect(microglia.isActive).toBe(false);
    });

    it('should activate successfully', async () => {
      await microglia.activate();

      expect(microglia.isActive).toBe(true);
    });
  });

  describe('error tracking', () => {
    beforeEach(async () => {
      await microglia.activate();
    });

    it('should record errors', () => {
      const error = new Error('Test error');

      microglia.recordError('neuron-1', error);

      const errors = microglia.getErrors('neuron-1');
      expect(errors).toHaveLength(1);
      expect(errors[0]?.error.message).toBe('Test error');
    });

    it('should track error count per source', () => {
      microglia.recordError('neuron-1', new Error('Error 1'));
      microglia.recordError('neuron-1', new Error('Error 2'));
      microglia.recordError('neuron-2', new Error('Error 3'));

      const stats = microglia.getHealthStats();

      expect(stats.errorCounts['neuron-1']).toBe(2);
      expect(stats.errorCounts['neuron-2']).toBe(1);
    });

    it('should trigger alerts when threshold exceeded', async () => {
      const alertHandler = jest.fn();
      microglia.onAlert(alertHandler);

      microglia.recordError('neuron-1', new Error('Error 1'));
      microglia.recordError('neuron-1', new Error('Error 2'));
      microglia.recordError('neuron-1', new Error('Error 3'));

      // Wait a bit for alert processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(alertHandler).toHaveBeenCalled();
      const call = alertHandler.mock.calls[0];
      expect(call?.[0]).toMatchObject({
        level: 'error',
        source: 'neuron-1',
      });
    });
  });

  describe('metrics collection', () => {
    beforeEach(async () => {
      await microglia.activate();
    });

    it('should record metrics', () => {
      microglia.recordMetric('neuron-1', 'cpu', 45.5);
      microglia.recordMetric('neuron-1', 'memory', 128);

      const metrics = microglia.getMetrics('neuron-1');

      expect(metrics['cpu']).toBe(45.5);
      expect(metrics['memory']).toBe(128);
    });

    it('should track metric history', () => {
      microglia.recordMetric('neuron-1', 'cpu', 30);
      microglia.recordMetric('neuron-1', 'cpu', 40);
      microglia.recordMetric('neuron-1', 'cpu', 50);

      const history = microglia.getMetricHistory('neuron-1', 'cpu');

      expect(history).toHaveLength(3);
      expect(history.map((h) => h.value)).toEqual([30, 40, 50]);
    });

    it('should calculate metric statistics', () => {
      microglia.recordMetric('neuron-1', 'cpu', 20);
      microglia.recordMetric('neuron-1', 'cpu', 40);
      microglia.recordMetric('neuron-1', 'cpu', 60);

      const stats = microglia.getMetricStats('neuron-1', 'cpu');

      expect(stats.avg).toBe(40);
      expect(stats.min).toBe(20);
      expect(stats.max).toBe(60);
      expect(stats.count).toBe(3);
    });
  });

  describe('health checks', () => {
    beforeEach(async () => {
      await microglia.activate();
    });

    it('should register health check for entity', () => {
      const healthCheck = jest.fn().mockResolvedValue({ healthy: true });

      microglia.registerHealthCheck('neuron-1', healthCheck);

      const registered = microglia.getRegisteredChecks();
      expect(registered).toContain('neuron-1');
    });

    it('should execute health checks', async () => {
      const healthCheck = jest.fn().mockResolvedValue({
        healthy: true,
        metrics: { uptime: 1000 },
      });

      microglia.registerHealthCheck('neuron-1', healthCheck);

      await microglia.performHealthCheck('neuron-1');

      expect(healthCheck).toHaveBeenCalled();
    });

    it('should detect unhealthy entities', async () => {
      const healthCheck = jest.fn().mockResolvedValue({
        healthy: false,
        reason: 'High error rate',
      });

      microglia.registerHealthCheck('neuron-1', healthCheck);

      const alertHandler = jest.fn();
      microglia.onAlert(alertHandler);

      await microglia.performHealthCheck('neuron-1');

      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warning',
          message: expect.stringContaining('unhealthy'),
        }),
      );
    });

    it('should run periodic health checks', async () => {
      const healthCheck = jest.fn().mockResolvedValue({ healthy: true });

      microglia.registerHealthCheck('neuron-1', healthCheck);

      // Wait for at least one health check cycle
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(healthCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('anomaly detection', () => {
    beforeEach(async () => {
      await microglia.activate();
    });

    it('should detect metric spikes', () => {
      // Establish baseline
      microglia.recordMetric('neuron-1', 'latency', 10);
      microglia.recordMetric('neuron-1', 'latency', 12);
      microglia.recordMetric('neuron-1', 'latency', 11);

      const alertHandler = jest.fn();
      microglia.onAlert(alertHandler);

      // Spike
      microglia.recordMetric('neuron-1', 'latency', 100);

      const anomalies = microglia.getAnomalies('neuron-1');
      expect(anomalies.length).toBeGreaterThan(0);
    });

    it('should detect error rate increases', () => {
      const alertHandler = jest.fn();
      microglia.onAlert(alertHandler);

      // Rapid error increase
      for (let i = 0; i < 5; i++) {
        microglia.recordError('neuron-1', new Error(`Error ${i}`));
      }

      const anomalies = microglia.getAnomalies('neuron-1');
      expect(anomalies.some((a) => a.type === 'error_rate')).toBe(true);
    });
  });

  describe('cleanup and recovery', () => {
    beforeEach(async () => {
      await microglia.activate();
    });

    it('should clear old errors', () => {
      microglia.recordError('neuron-1', new Error('Error 1'));

      microglia.clearErrors('neuron-1');

      const errors = microglia.getErrors('neuron-1');
      expect(errors).toHaveLength(0);
    });

    it('should prune old metrics', () => {
      microglia.recordMetric('neuron-1', 'cpu', 30);
      microglia.recordMetric('neuron-1', 'cpu', 40);

      microglia.pruneOldMetrics('neuron-1', 'cpu', 1);

      const history = microglia.getMetricHistory('neuron-1', 'cpu');
      expect(history).toHaveLength(1);
    });
  });

  describe('observability', () => {
    beforeEach(async () => {
      await microglia.activate();
    });

    it('should provide overall system health', () => {
      microglia.recordError('neuron-1', new Error('Error'));
      microglia.recordMetric('neuron-2', 'cpu', 50);

      const health = microglia.getSystemHealth();

      expect(health.totalErrors).toBe(1);
      expect(health.monitoredEntities).toBe(2);
    });

    it('should list all monitored entities', () => {
      microglia.recordError('neuron-1', new Error('Error'));
      microglia.recordMetric('neuron-2', 'cpu', 50);
      microglia.recordMetric('neuron-3', 'memory', 100);

      const entities = microglia.getMonitoredEntities();

      expect(entities).toContain('neuron-1');
      expect(entities).toContain('neuron-2');
      expect(entities).toContain('neuron-3');
    });

    it('should export health report', () => {
      microglia.recordError('neuron-1', new Error('Test error'));
      microglia.recordMetric('neuron-1', 'cpu', 50);

      const report = microglia.exportHealthReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('stats');
      expect(report).toHaveProperty('entities');
    });
  });
});
