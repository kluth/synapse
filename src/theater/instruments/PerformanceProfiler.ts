/**
 * PerformanceProfiler - Performance monitoring tool
 *
 * PerformanceProfiler is a Microscope lens that integrates with
 * VisualOligodendrocyte to monitor render performance, identify
 * bottlenecks, and suggest optimizations.
 */

import type { MicroscopeLens, InspectionResult, InspectionIssue } from './Microscope';
import type { VisualNeuron } from '../../ui/VisualNeuron';

/**
 * Performance metric
 */
export interface PerformanceMetric {
  /**
   * Metric name
   */
  name: string;

  /**
   * Value
   */
  value: number;

  /**
   * Unit
   */
  unit: 'ms' | 'fps' | 'count' | 'bytes' | 'percent';

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Threshold (for warnings)
   */
  threshold?: number;
}

/**
 * Render profile
 */
export interface RenderProfile {
  /**
   * Component ID
   */
  componentId: string;

  /**
   * Render duration (ms)
   */
  duration: number;

  /**
   * Render count
   */
  renderCount: number;

  /**
   * Last render time
   */
  lastRender: Date;

  /**
   * Average render time
   */
  avgRenderTime: number;

  /**
   * Max render time
   */
  maxRenderTime: number;

  /**
   * Min render time
   */
  minRenderTime: number;

  /**
   * Memoization hits
   */
  memoHits: number;

  /**
   * Memoization misses
   */
  memoMisses: number;

  /**
   * Optimizations applied
   */
  optimizations: string[];
}

/**
 * Performance bottleneck
 */
export interface PerformanceBottleneck {
  /**
   * Bottleneck type
   */
  type: 'slow-render' | 'excessive-renders' | 'memory-leak' | 'large-bundle';

  /**
   * Severity
   */
  severity: 'critical' | 'warning' | 'info';

  /**
   * Description
   */
  description: string;

  /**
   * Affected component
   */
  component: string;

  /**
   * Metric value
   */
  value: number;

  /**
   * Recommendation
   */
  recommendation: string;
}

/**
 * PerformanceProfiler configuration
 */
export interface PerformanceProfilerConfig {
  /**
   * Slow render threshold (ms)
   */
  slowRenderThreshold?: number;

  /**
   * Excessive render threshold
   */
  excessiveRenderThreshold?: number;

  /**
   * Track memory usage
   */
  trackMemory?: boolean;

  /**
   * Sample rate (0-1)
   */
  sampleRate?: number;

  /**
   * Enable profiler integration
   */
  enableProfiler?: boolean;
}

/**
 * PerformanceProfiler - Performance monitoring
 */
export class PerformanceProfiler implements MicroscopeLens {
  public readonly id = 'performance-profiler';
  public readonly name = 'Performance Profiler';
  public readonly mode = 'performance' as const;

  private profiles: Map<string, RenderProfile> = new Map();
  private metrics: PerformanceMetric[] = [];
  private slowRenderThreshold: number = 16; // 60fps target
  private excessiveRenderThreshold: number = 100;
  private trackMemory: boolean = true;
  private sampleRate: number = 1.0;

  constructor(config: PerformanceProfilerConfig = {}) {
    if (config.slowRenderThreshold !== undefined) {
      this.slowRenderThreshold = config.slowRenderThreshold;
    }
    if (config.excessiveRenderThreshold !== undefined) {
      this.excessiveRenderThreshold = config.excessiveRenderThreshold;
    }
    if (config.trackMemory !== undefined) {
      this.trackMemory = config.trackMemory;
    }
    if (config.sampleRate !== undefined) {
      this.sampleRate = config.sampleRate;
    }
    // enableProfiler config is reserved for future use
    if (config.enableProfiler !== undefined) {
      // Future: this.enableProfiler = config.enableProfiler;
    }
  }

  /**
   * Initialize profiler
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async initialize(): Promise<void> {
    this.profiles.clear();
    this.metrics = [];
  }

  /**
   * Cleanup profiler
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async cleanup(): Promise<void> {
    this.profiles.clear();
    this.metrics = [];
  }

  /**
   * Inspect component performance
   */
  public async inspect(component: VisualNeuron): Promise<InspectionResult> {
    const componentId = this.getComponentId(component);
    const issues: InspectionIssue[] = [];

    // Profile render performance
    const profile = await this.profileRender(component, componentId);
    this.profiles.set(componentId, profile);

    // Collect metrics
    const metrics = this.collectMetrics(component);
    this.metrics.push(...metrics);

    // Detect bottlenecks
    const bottlenecks = this.detectBottlenecks();
    for (const bottleneck of bottlenecks) {
      issues.push({
        severity: bottleneck.severity === 'critical' ? 'error' : bottleneck.severity,
        message: bottleneck.description,
        source: bottleneck.component,
        suggestion: bottleneck.recommendation,
      });
    }

    // Calculate performance score
    const score = this.calculatePerformanceScore(profile);

    return {
      mode: 'performance',
      timestamp: new Date(),
      componentId,
      data: {
        profile,
        metrics,
        bottlenecks,
        score,
        stats: {
          totalProfiles: this.profiles.size,
          totalMetrics: this.metrics.length,
          avgRenderTime: this.calculateAvgRenderTime(),
          fps: this.calculateFPS(),
        },
      },
      issues,
      metadata: {
        slowRenderThreshold: this.slowRenderThreshold,
        sampleRate: this.sampleRate,
      },
    };
  }

  /**
   * Render profiler UI
   */
  public render(): string {
    const profiles = Array.from(this.profiles.values());
    const avgRenderTime = this.calculateAvgRenderTime();
    const fps = this.calculateFPS();

    return `
      <div class="performance-profiler">
        <div class="profiler-stats">
          <div class="stat-item">
            <label>Avg Render Time</label>
            <span>${avgRenderTime.toFixed(2)}ms</span>
          </div>
          <div class="stat-item">
            <label>FPS</label>
            <span>${fps.toFixed(1)}</span>
          </div>
          <div class="stat-item">
            <label>Components</label>
            <span>${profiles.length}</span>
          </div>
        </div>
        <div class="profile-list">
          ${profiles
            .map(
              (profile) => `
            <div class="profile-item">
              <strong>${profile.componentId}</strong>
              <span>Renders: ${profile.renderCount}</span>
              <span>Avg: ${profile.avgRenderTime.toFixed(2)}ms</span>
              <span>Max: ${profile.maxRenderTime.toFixed(2)}ms</span>
              ${profile.avgRenderTime > this.slowRenderThreshold ? '<span class="warning">⚠️ Slow</span>' : ''}
            </div>
          `,
            )
            .join('')}
        </div>
        <div class="metrics-chart">
          <canvas id="performance-chart"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Profile component render
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async profileRender(
    _component: VisualNeuron,
    componentId: string,
  ): Promise<RenderProfile> {
    const existingProfile = this.profiles.get(componentId);

    // Start timing
    const startTime = performance.now();

    // Simulate render timing (sampling)
    // In a real implementation, this would hook into the actual render cycle
    if (Math.random() < this.sampleRate) {
      // Measure render performance without actually rendering
      // This would be replaced with actual render hooking in production
    }

    const duration = performance.now() - startTime;

    // Update profile
    const renderCount = (existingProfile?.renderCount ?? 0) + 1;
    const totalTime = (existingProfile?.avgRenderTime ?? 0) * (renderCount - 1) + duration;
    const avgRenderTime = totalTime / renderCount;

    // Get memoization stats (would integrate with VisualOligodendrocyte when available)
    const memoStats = { hits: 0, misses: 0 };

    const profile: RenderProfile = {
      componentId,
      duration,
      renderCount,
      lastRender: new Date(),
      avgRenderTime,
      maxRenderTime: Math.max(existingProfile?.maxRenderTime ?? 0, duration),
      minRenderTime: Math.min(existingProfile?.minRenderTime ?? Infinity, duration),
      memoHits: memoStats.hits,
      memoMisses: memoStats.misses,
      optimizations: [],
    };

    return profile;
  }

  /**
   * Collect performance metrics
   */
  private collectMetrics(_component: VisualNeuron): PerformanceMetric[] {
    const metrics: PerformanceMetric[] = [];
    const now = new Date();

    // Frame rate
    const fps = this.calculateFPS();
    metrics.push({
      name: 'FPS',
      value: fps,
      unit: 'fps',
      timestamp: now,
      threshold: 60,
    });

    // Memory usage (if available)
    if (this.trackMemory && 'memory' in performance) {
      const memInfo = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      metrics.push({
        name: 'Memory Usage',
        value: memInfo.usedJSHeapSize / 1024 / 1024,
        unit: 'bytes',
        timestamp: now,
      });
    }

    return metrics;
  }

  /**
   * Detect performance bottlenecks
   */
  private detectBottlenecks(): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];

    for (const profile of this.profiles.values()) {
      // Slow renders
      if (profile.avgRenderTime > this.slowRenderThreshold) {
        bottlenecks.push({
          type: 'slow-render',
          severity: profile.avgRenderTime > this.slowRenderThreshold * 2 ? 'critical' : 'warning',
          description: `Component renders slowly (${profile.avgRenderTime.toFixed(2)}ms avg)`,
          component: profile.componentId,
          value: profile.avgRenderTime,
          recommendation: 'Consider memoization, virtualization, or code splitting',
        });
      }

      // Excessive renders
      if (profile.renderCount > this.excessiveRenderThreshold) {
        bottlenecks.push({
          type: 'excessive-renders',
          severity: 'warning',
          description: `Component rendered ${profile.renderCount} times`,
          component: profile.componentId,
          value: profile.renderCount,
          recommendation: 'Review dependencies and consider React.memo or useMemo',
        });
      }

      // Poor memoization hit rate
      const memoTotal = profile.memoHits + profile.memoMisses;
      if (memoTotal > 10) {
        const hitRate = profile.memoHits / memoTotal;
        if (hitRate < 0.5) {
          bottlenecks.push({
            type: 'slow-render',
            severity: 'info',
            description: `Low memoization hit rate (${(hitRate * 100).toFixed(1)}%)`,
            component: profile.componentId,
            value: hitRate,
            recommendation: 'Review memoization dependencies and equality checks',
          });
        }
      }
    }

    return bottlenecks;
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(profile: RenderProfile): number {
    let score = 100;

    // Penalize slow renders
    if (profile.avgRenderTime > this.slowRenderThreshold) {
      score -= Math.min(30, (profile.avgRenderTime / this.slowRenderThreshold) * 10);
    }

    // Penalize excessive renders
    if (profile.renderCount > this.excessiveRenderThreshold) {
      score -= Math.min(20, (profile.renderCount / this.excessiveRenderThreshold) * 10);
    }

    // Reward good memoization
    const memoTotal = profile.memoHits + profile.memoMisses;
    if (memoTotal > 0) {
      const hitRate = profile.memoHits / memoTotal;
      score += hitRate * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate average render time across all components
   */
  private calculateAvgRenderTime(): number {
    if (this.profiles.size === 0) {
      return 0;
    }

    let total = 0;
    for (const profile of this.profiles.values()) {
      total += profile.avgRenderTime;
    }

    return total / this.profiles.size;
  }

  /**
   * Calculate frames per second
   */
  private calculateFPS(): number {
    const avgRenderTime = this.calculateAvgRenderTime();
    if (avgRenderTime === 0) {
      return 60;
    }

    return Math.min(60, 1000 / avgRenderTime);
  }

  /**
   * Get component ID
   */
  private getComponentId(_component: VisualNeuron): string {
    return 'component';
  }

  /**
   * Get profile by component ID
   */
  public getProfile(componentId: string): RenderProfile | undefined {
    return this.profiles.get(componentId);
  }

  /**
   * Get all profiles
   */
  public getAllProfiles(): RenderProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear profiles and metrics
   */
  public clear(): void {
    this.profiles.clear();
    this.metrics = [];
  }
}
