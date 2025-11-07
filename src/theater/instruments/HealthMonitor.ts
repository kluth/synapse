/**
 * HealthMonitor - Component health monitoring tool
 *
 * HealthMonitor is a Microscope lens that integrates with Microglia
 * to monitor component health, detect errors, track warnings, and
 * provide diagnostics.
 */

import type { MicroscopeLens, InspectionResult, InspectionIssue } from './Microscope';
import type { VisualNeuron } from '../../ui/VisualNeuron';

/**
 * Health status
 */
export type HealthStatus = 'healthy' | 'warning' | 'error' | 'critical';

/**
 * Health check result
 */
export interface HealthCheck {
  /**
   * Check name
   */
  name: string;

  /**
   * Status
   */
  status: HealthStatus;

  /**
   * Message
   */
  message: string;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Details
   */
  details?: Record<string, unknown>;
}

/**
 * Component health report
 */
export interface HealthReport {
  /**
   * Component ID
   */
  componentId: string;

  /**
   * Overall status
   */
  status: HealthStatus;

  /**
   * Health checks
   */
  checks: HealthCheck[];

  /**
   * Error count
   */
  errorCount: number;

  /**
   * Warning count
   */
  warningCount: number;

  /**
   * Last error
   */
  lastError?: Error;

  /**
   * Last warning
   */
  lastWarning?: string;

  /**
   * Uptime (ms)
   */
  uptime: number;

  /**
   * Health score (0-100)
   */
  healthScore: number;
}

/**
 * Error entry
 */
export interface ErrorEntry {
  /**
   * Error object
   */
  error: Error;

  /**
   * Component ID
   */
  componentId: string;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Stack trace
   */
  stackTrace: string;

  /**
   * Error boundary caught
   */
  caught: boolean;

  /**
   * Recovery attempted
   */
  recovered: boolean;
}

/**
 * HealthMonitor configuration
 */
export interface HealthMonitorConfig {
  /**
   * Enable error boundaries
   */
  enableErrorBoundaries?: boolean;

  /**
   * Auto-recover from errors
   */
  autoRecover?: boolean;

  /**
   * Max error history
   */
  maxErrorHistory?: number;

  /**
   * Health check interval (ms)
   */
  healthCheckInterval?: number;

  /**
   * Enable diagnostics
   */
  enableDiagnostics?: boolean;
}

/**
 * HealthMonitor - Component health monitoring
 */
export class HealthMonitor implements MicroscopeLens {
  public readonly id = 'health-monitor';
  public readonly name = 'Health Monitor';
  public readonly mode = 'health' as const;

  private reports: Map<string, HealthReport> = new Map();
  private errors: ErrorEntry[] = [];
  private warnings: Map<string, string[]> = new Map();
  private mountTimes: Map<string, Date> = new Map();
  private autoRecover: boolean = false;
  private maxErrorHistory: number = 100;
  private healthCheckInterval: number = 5000;
  private enableDiagnostics: boolean = true;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: HealthMonitorConfig = {}) {
    // Enable error boundaries config is stored but not used currently
    // Will be activated when Microglia integration is complete
    if (config.enableErrorBoundaries !== undefined) {
      // Future: this.enableErrorBoundaries = config.enableErrorBoundaries;
    }
    if (config.autoRecover !== undefined) {
      this.autoRecover = config.autoRecover;
    }
    if (config.maxErrorHistory !== undefined) {
      this.maxErrorHistory = config.maxErrorHistory;
    }
    if (config.healthCheckInterval !== undefined) {
      this.healthCheckInterval = config.healthCheckInterval;
    }
    if (config.enableDiagnostics !== undefined) {
      this.enableDiagnostics = config.enableDiagnostics;
    }
  }

  /**
   * Initialize monitor
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async initialize(): Promise<void> {
    this.reports.clear();
    this.errors = [];
    this.warnings.clear();
    this.mountTimes.clear();

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Cleanup monitor
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async cleanup(): Promise<void> {
    this.stopHealthChecks();
    this.reports.clear();
    this.errors = [];
    this.warnings.clear();
    this.mountTimes.clear();
  }

  /**
   * Inspect component health
   */
  public async inspect(component: VisualNeuron): Promise<InspectionResult> {
    const componentId = this.getComponentId(component);
    const issues: InspectionIssue[] = [];

    // Run health checks
    const checks = await this.runHealthChecks(component);

    // Calculate health metrics
    const errorCount = this.getErrorCount(componentId);
    const warningCount = this.getWarningCount(componentId);
    const uptime = this.getUptime(componentId);
    const healthScore = this.calculateHealthScore(checks, errorCount, warningCount);

    // Determine overall status
    const status = this.determineHealthStatus(checks, errorCount);

    // Create health report
    const report: HealthReport = {
      componentId,
      status,
      checks,
      errorCount,
      warningCount,
      uptime,
      healthScore,
    };

    // Add optional properties if they exist
    const lastError = this.getLastError(componentId);
    if (lastError !== undefined) {
      report.lastError = lastError;
    }

    const lastWarning = this.getLastWarning(componentId);
    if (lastWarning !== undefined) {
      report.lastWarning = lastWarning;
    }

    this.reports.set(componentId, report);

    // Convert checks to issues
    for (const check of checks) {
      if (check.status === 'error' || check.status === 'critical') {
        issues.push({
          severity: 'error',
          message: `Health check failed: ${check.message}`,
          source: check.name,
          suggestion: 'Review component implementation and error logs',
        });
      } else if (check.status === 'warning') {
        issues.push({
          severity: 'warning',
          message: `Health check warning: ${check.message}`,
          source: check.name,
        });
      }
    }

    return {
      mode: 'health',
      timestamp: new Date(),
      componentId,
      data: {
        report,
        recentErrors: this.getRecentErrors(componentId, 5),
        recentWarnings: this.getRecentWarnings(componentId, 5),
        stats: {
          totalErrors: this.errors.length,
          totalWarnings: Array.from(this.warnings.values()).reduce(
            (sum, arr) => sum + arr.length,
            0,
          ),
          healthyComponents: Array.from(this.reports.values()).filter((r) => r.status === 'healthy')
            .length,
        },
      },
      issues,
      metadata: {
        autoRecover: this.autoRecover,
        enableDiagnostics: this.enableDiagnostics,
      },
    };
  }

  /**
   * Render monitor UI
   */
  public render(): string {
    const reports = Array.from(this.reports.values());
    const healthyCount = reports.filter((r) => r.status === 'healthy').length;
    const totalErrors = this.errors.length;

    return `
      <div class="health-monitor">
        <div class="monitor-stats">
          <div class="stat-item">
            <label>Healthy Components</label>
            <span>${healthyCount} / ${reports.length}</span>
          </div>
          <div class="stat-item">
            <label>Total Errors</label>
            <span>${totalErrors}</span>
          </div>
        </div>
        <div class="health-reports">
          ${reports
            .map(
              (report) => `
            <div class="health-report ${report.status}">
              <div class="report-header">
                <strong>${report.componentId}</strong>
                <span class="status-badge ${report.status}">${report.status}</span>
                <span class="health-score">${report.healthScore.toFixed(0)}%</span>
              </div>
              <div class="report-details">
                <span>Errors: ${report.errorCount}</span>
                <span>Warnings: ${report.warningCount}</span>
                <span>Uptime: ${(report.uptime / 1000).toFixed(1)}s</span>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
        <div class="error-log">
          <h4>Recent Errors</h4>
          ${this.errors
            .slice(-5)
            .reverse()
            .map(
              (entry) => `
            <div class="error-entry">
              <strong>${entry.error.message}</strong>
              <span>${entry.timestamp.toLocaleTimeString()}</span>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Run health checks on component
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async runHealthChecks(component: VisualNeuron): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];
    const componentId = this.getComponentId(component);

    // Check for errors
    const errorCount = this.getErrorCount(componentId);
    checks.push({
      name: 'Error Check',
      status: errorCount === 0 ? 'healthy' : errorCount < 5 ? 'warning' : 'error',
      message:
        errorCount === 0
          ? 'No errors detected'
          : `${errorCount} error${errorCount > 1 ? 's' : ''} detected`,
      timestamp: new Date(),
      details: { errorCount },
    });

    // Check uptime
    const uptime = this.getUptime(componentId);
    checks.push({
      name: 'Uptime Check',
      status: 'healthy',
      message: `Component running for ${(uptime / 1000).toFixed(1)}s`,
      timestamp: new Date(),
      details: { uptime },
    });

    // Check warnings
    const warningCount = this.getWarningCount(componentId);
    checks.push({
      name: 'Warning Check',
      status: warningCount === 0 ? 'healthy' : 'warning',
      message:
        warningCount === 0
          ? 'No warnings detected'
          : `${warningCount} warning${warningCount > 1 ? 's' : ''} detected`,
      timestamp: new Date(),
      details: { warningCount },
    });

    return checks;
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer !== null) {
      return;
    }

    this.healthCheckTimer = setInterval(() => {
      // Run health checks on all monitored components
      // This would trigger re-inspection in a real implementation
    }, this.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  private stopHealthChecks(): void {
    if (this.healthCheckTimer !== null) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Record an error
   */
  public recordError(error: Error, componentId: string, caught: boolean = false): void {
    const entry: ErrorEntry = {
      error,
      componentId,
      timestamp: new Date(),
      stackTrace: error.stack ?? '',
      caught,
      recovered: false,
    };

    this.errors.push(entry);

    // Trim if exceeded max
    if (this.errors.length > this.maxErrorHistory) {
      this.errors = this.errors.slice(-this.maxErrorHistory);
    }

    // Attempt auto-recovery if enabled
    if (this.autoRecover) {
      entry.recovered = this.attemptRecovery(componentId, error);
    }
  }

  /**
   * Record a warning
   */
  public recordWarning(warning: string, componentId: string): void {
    if (!this.warnings.has(componentId)) {
      this.warnings.set(componentId, []);
    }

    const warnings = this.warnings.get(componentId);
    if (warnings !== undefined) {
      warnings.push(warning);
    }
  }

  /**
   * Track component mount
   */
  public trackMount(componentId: string): void {
    this.mountTimes.set(componentId, new Date());
  }

  /**
   * Attempt error recovery
   */
  private attemptRecovery(_componentId: string, _error: Error): boolean {
    // Recovery mechanism would be implemented when Microglia is available
    // This is simplified - real implementation would use actual recovery mechanisms
    return false;
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(
    checks: HealthCheck[],
    errorCount: number,
    warningCount: number,
  ): number {
    let score = 100;

    // Penalize errors
    score -= errorCount * 10;

    // Penalize warnings
    score -= warningCount * 2;

    // Penalize failed checks
    for (const check of checks) {
      if (check.status === 'error' || check.status === 'critical') {
        score -= 15;
      } else if (check.status === 'warning') {
        score -= 5;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine overall health status
   */
  private determineHealthStatus(checks: HealthCheck[], errorCount: number): HealthStatus {
    if (errorCount >= 10 || checks.some((c) => c.status === 'critical')) {
      return 'critical';
    }

    if (errorCount > 0 || checks.some((c) => c.status === 'error')) {
      return 'error';
    }

    if (checks.some((c) => c.status === 'warning')) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Get component ID
   */
  private getComponentId(_component: VisualNeuron): string {
    return 'component';
  }

  /**
   * Get error count for component
   */
  private getErrorCount(componentId: string): number {
    return this.errors.filter((e) => e.componentId === componentId).length;
  }

  /**
   * Get warning count for component
   */
  private getWarningCount(componentId: string): number {
    return this.warnings.get(componentId)?.length ?? 0;
  }

  /**
   * Get component uptime
   */
  private getUptime(componentId: string): number {
    const mountTime = this.mountTimes.get(componentId);
    if (mountTime === undefined) {
      this.mountTimes.set(componentId, new Date());
      return 0;
    }

    return Date.now() - mountTime.getTime();
  }

  /**
   * Get last error for component
   */
  private getLastError(componentId: string): Error | undefined {
    const errors = this.errors.filter((e) => e.componentId === componentId);
    return errors[errors.length - 1]?.error;
  }

  /**
   * Get last warning for component
   */
  private getLastWarning(componentId: string): string | undefined {
    const warnings = this.warnings.get(componentId);
    return warnings?.[warnings.length - 1];
  }

  /**
   * Get recent errors for component
   */
  private getRecentErrors(componentId: string, limit: number): ErrorEntry[] {
    return this.errors.filter((e) => e.componentId === componentId).slice(-limit);
  }

  /**
   * Get recent warnings for component
   */
  private getRecentWarnings(componentId: string, limit: number): string[] {
    const warnings = this.warnings.get(componentId) ?? [];
    return warnings.slice(-limit);
  }

  /**
   * Get health report
   */
  public getReport(componentId: string): HealthReport | undefined {
    return this.reports.get(componentId);
  }

  /**
   * Get all health reports
   */
  public getAllReports(): HealthReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Get all errors
   */
  public getAllErrors(): ErrorEntry[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Clear warnings
   */
  public clearWarnings(): void {
    this.warnings.clear();
  }
}
