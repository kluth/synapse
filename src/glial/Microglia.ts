/**
 * Microglia - Health Monitoring and Observability System
 *
 * Biological role: Microglia are the immune cells of the nervous system. They detect
 * pathogens, clear cellular debris, prune synapses, and maintain neural health through
 * constant surveillance.
 *
 * Software mapping: Observability and health monitoring system that tracks errors,
 * metrics, and system health. Implements anomaly detection, alerting, and provides
 * insights into the overall health of the neural network.
 */

interface MicrogliaConfig {
  readonly id: string;
  readonly healthCheckInterval?: number; // ms
  readonly alertThreshold?: number; // Error count before alert
  readonly metricHistorySize?: number;
}

interface ErrorRecord {
  error: Error;
  timestamp: Date;
  source: string;
}

interface MetricRecord {
  value: number;
  timestamp: Date;
}

interface HealthCheckResult {
  healthy: boolean;
  reason?: string;
  metrics?: Record<string, unknown>;
}

type HealthCheckFunction = () => Promise<HealthCheckResult>;

interface Alert {
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
  timestamp: Date;
  data?: unknown;
}

type AlertHandler = (alert: Alert) => void;

interface Anomaly {
  type: 'spike' | 'error_rate' | 'threshold';
  metric?: string;
  value?: number;
  timestamp: Date;
}

interface HealthStats {
  totalErrors: number;
  errorCounts: Record<string, number>;
  monitoredEntities: number;
}

interface MetricStats {
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface HealthReport {
  timestamp: Date;
  stats: HealthStats;
  entities: Array<{
    id: string;
    errors: number;
    metrics: Record<string, number>;
  }>;
}

export class Microglia {
  public readonly id: string;
  public isActive = false;

  private readonly healthCheckInterval: number;
  private readonly alertThreshold: number;
  private readonly metricHistorySize: number;

  // Error tracking
  private errors: Map<string, ErrorRecord[]> = new Map();

  // Metrics tracking
  private metrics: Map<string, Map<string, MetricRecord[]>> = new Map();

  // Health checks
  private healthChecks: Map<string, HealthCheckFunction> = new Map();

  // Anomaly tracking
  private anomalies: Map<string, Anomaly[]> = new Map();

  // Alert handlers
  private alertHandlers: AlertHandler[] = [];

  // Timers
  private healthCheckTimer?: NodeJS.Timeout | undefined;

  constructor(config: MicrogliaConfig) {
    this.id = config.id;
    this.healthCheckInterval = config.healthCheckInterval ?? 5000;
    this.alertThreshold = config.alertThreshold ?? 10;
    this.metricHistorySize = config.metricHistorySize ?? 100;
  }

  /**
   * LIFECYCLE MANAGEMENT
   */

  public async activate(): Promise<void> {
    if (this.isActive) {
      throw new Error('Microglia is already active');
    }

    this.isActive = true;

    // Start periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.runAllHealthChecks().catch((error) => {
        console.error('Error running health checks:', error);
      });
    }, this.healthCheckInterval);

    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    this.isActive = false;

    if (this.healthCheckTimer !== undefined) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    this.errors.clear();
    this.metrics.clear();
    this.healthChecks.clear();
    this.anomalies.clear();
    this.alertHandlers = [];

    return Promise.resolve();
  }

  /**
   * ERROR TRACKING
   */

  public recordError(source: string, error: Error): void {
    this.ensureActive();

    const record: ErrorRecord = {
      error,
      timestamp: new Date(),
      source,
    };

    const sourceErrors = this.errors.get(source) ?? [];
    sourceErrors.push(record);
    this.errors.set(source, sourceErrors);

    // Check for error threshold
    if (sourceErrors.length >= this.alertThreshold) {
      this.emitAlert({
        level: 'error',
        message: `Error threshold exceeded for ${source}`,
        source,
        timestamp: new Date(),
        data: { errorCount: sourceErrors.length },
      });
    }

    // Detect error rate anomaly
    const recentErrors = sourceErrors.filter(
      (e) => Date.now() - e.timestamp.getTime() < 60000, // Last minute
    );

    if (recentErrors.length >= 5) {
      const anomaly: Anomaly = {
        type: 'error_rate',
        timestamp: new Date(),
      };

      const entityAnomalies = this.anomalies.get(source) ?? [];
      entityAnomalies.push(anomaly);
      this.anomalies.set(source, entityAnomalies);
    }
  }

  public getErrors(source: string): ErrorRecord[] {
    this.ensureActive();
    return [...(this.errors.get(source) ?? [])];
  }

  public clearErrors(source: string): void {
    this.ensureActive();
    this.errors.delete(source);
  }

  /**
   * METRICS COLLECTION
   */

  public recordMetric(source: string, metricName: string, value: number): void {
    this.ensureActive();

    const sourceMetrics: Map<string, MetricRecord[]> =
      this.metrics.get(source) ?? new Map<string, MetricRecord[]>();
    const metricHistory: MetricRecord[] = sourceMetrics.get(metricName) ?? [];

    const record: MetricRecord = {
      value,
      timestamp: new Date(),
    };

    metricHistory.push(record);

    // Limit history size
    if (metricHistory.length > this.metricHistorySize) {
      metricHistory.shift();
    }

    sourceMetrics.set(metricName, metricHistory);
    this.metrics.set(source, sourceMetrics);

    // Detect spike anomaly
    if (metricHistory.length >= 3) {
      const recent: MetricRecord[] = metricHistory.slice(-3);
      const baseline: number[] = recent.slice(0, -1).map((r) => r.value);
      const avg = baseline.reduce((sum, v) => sum + v, 0) / baseline.length;
      const current = value;

      // Spike if current value is 5x the average
      if (current > avg * 5) {
        const anomaly: Anomaly = {
          type: 'spike',
          metric: metricName,
          value: current,
          timestamp: new Date(),
        };

        const entityAnomalies = this.anomalies.get(source) ?? [];
        entityAnomalies.push(anomaly);
        this.anomalies.set(source, entityAnomalies);
      }
    }
  }

  public getMetrics(source: string): Record<string, number> {
    this.ensureActive();

    const sourceMetrics = this.metrics.get(source);

    if (sourceMetrics === undefined) {
      return {};
    }

    const result: Record<string, number> = {};

    for (const [metricName, history] of sourceMetrics.entries()) {
      const latest = history[history.length - 1];

      if (latest !== undefined) {
        result[metricName] = latest.value;
      }
    }

    return result;
  }

  public getMetricHistory(source: string, metricName: string): MetricRecord[] {
    this.ensureActive();

    const sourceMetrics = this.metrics.get(source);

    if (sourceMetrics === undefined) {
      return [];
    }

    return [...(sourceMetrics.get(metricName) ?? [])];
  }

  public getMetricStats(source: string, metricName: string): MetricStats {
    const history = this.getMetricHistory(source, metricName);

    if (history.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const values = history.map((r) => r.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      avg,
      min,
      max,
      count: history.length,
    };
  }

  public pruneOldMetrics(source: string, metricName: string, keepCount: number): void {
    this.ensureActive();

    const sourceMetrics = this.metrics.get(source);

    if (sourceMetrics === undefined) {
      return;
    }

    const history = sourceMetrics.get(metricName) ?? [];

    if (history.length > keepCount) {
      const pruned = history.slice(-keepCount);
      sourceMetrics.set(metricName, pruned);
    }
  }

  /**
   * HEALTH CHECKS
   */

  public registerHealthCheck(entity: string, checkFn: HealthCheckFunction): void {
    this.ensureActive();
    this.healthChecks.set(entity, checkFn);
  }

  public getRegisteredChecks(): string[] {
    this.ensureActive();
    return Array.from(this.healthChecks.keys());
  }

  public async performHealthCheck(entity: string): Promise<HealthCheckResult> {
    this.ensureActive();

    const checkFn = this.healthChecks.get(entity);

    if (checkFn === undefined) {
      throw new Error(`No health check registered for ${entity}`);
    }

    try {
      const result = await checkFn();

      if (!result.healthy) {
        this.emitAlert({
          level: 'warning',
          message: `Entity ${entity} is unhealthy: ${result.reason ?? 'unknown'}`,
          source: entity,
          timestamp: new Date(),
          data: result,
        });
      }

      return result;
    } catch (error) {
      this.recordError(entity, error as Error);

      return {
        healthy: false,
        reason: `Health check failed: ${(error as Error).message}`,
      };
    }
  }

  private async runAllHealthChecks(): Promise<void> {
    const checks = Array.from(this.healthChecks.keys());

    for (const entity of checks) {
      await this.performHealthCheck(entity);
    }
  }

  /**
   * ANOMALY DETECTION
   */

  public getAnomalies(source: string): Anomaly[] {
    this.ensureActive();
    return [...(this.anomalies.get(source) ?? [])];
  }

  /**
   * ALERTING
   */

  public onAlert(handler: AlertHandler): void {
    this.alertHandlers.push(handler);
  }

  private emitAlert(alert: Alert): void {
    for (const handler of this.alertHandlers) {
      try {
        handler(alert);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    }
  }

  /**
   * OBSERVABILITY
   */

  public getHealthStats(): HealthStats {
    const errorCounts: Record<string, number> = {};

    for (const [source, errors] of this.errors.entries()) {
      errorCounts[source] = errors.length;
    }

    const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);
    const monitoredEntities = this.getMonitoredEntities().length;

    return {
      totalErrors,
      errorCounts,
      monitoredEntities,
    };
  }

  public getSystemHealth(): HealthStats {
    return this.getHealthStats();
  }

  public getMonitoredEntities(): string[] {
    const entities = new Set<string>();

    for (const source of this.errors.keys()) {
      entities.add(source);
    }

    for (const source of this.metrics.keys()) {
      entities.add(source);
    }

    return Array.from(entities);
  }

  public exportHealthReport(): HealthReport {
    this.ensureActive();

    const entities = this.getMonitoredEntities().map((id) => ({
      id,
      errors: this.errors.get(id)?.length ?? 0,
      metrics: this.getMetrics(id),
    }));

    return {
      timestamp: new Date(),
      stats: this.getHealthStats(),
      entities,
    };
  }

  /**
   * INTERNAL METHODS
   */

  private ensureActive(): void {
    if (!this.isActive) {
      throw new Error('Microglia is not active');
    }
  }
}
