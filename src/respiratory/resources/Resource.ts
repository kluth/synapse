/**
 * Resource - Base class for external resources
 *
 * Manages lifecycle and connections for external resources like
 * databases, caches, and object storage.
 */

import { EventEmitter } from 'events';

/**
 * Resource health status
 */
export type ResourceHealth = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Resource connection state
 */
export type ResourceState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Resource configuration
 */
export interface ResourceConfig {
  name?: string;
  maxRetries?: number;
  retryDelay?: number;
  healthCheckInterval?: number;
  timeout?: number;
}

/**
 * Resource statistics
 */
export interface ResourceStats {
  connections: number;
  activeConnections: number;
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
}

/**
 * Base class for managing external resources
 */
export abstract class Resource extends EventEmitter {
  protected name: string;
  protected state: ResourceState = 'disconnected';
  protected maxRetries: number;
  protected retryDelay: number;
  protected healthCheckInterval: number;
  protected timeout: number;
  protected healthCheckTimer: NodeJS.Timeout | null = null;
  protected connectedAt: number | null = null;
  protected stats: ResourceStats = {
    connections: 0,
    activeConnections: 0,
    totalRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    uptime: 0,
  };

  constructor(config: ResourceConfig = {}) {
    super();
    this.name = config.name ?? 'Resource';
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.healthCheckInterval = config.healthCheckInterval ?? 30000;
    this.timeout = config.timeout ?? 5000;
  }

  /**
   * Get resource name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get resource type
   */
  public abstract getType(): string;

  /**
   * Connect to resource
   */
  public async connect(): Promise<void> {
    if (this.state === 'connected') {
      return;
    }

    this.state = 'connecting';
    this.emit('connecting');

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.doConnect();
        this.state = 'connected';
        this.connectedAt = Date.now();
        this.stats.connections++;
        this.emit('connected');
        this.startHealthCheck();
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Connection failed');
        this.emit('connection:retry', { attempt, error: lastError });

        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    this.state = 'error';
    this.emit('connection:failed', lastError);
    throw lastError ?? new Error('Failed to connect after retries');
  }

  /**
   * Disconnect from resource
   */
  public async disconnect(): Promise<void> {
    this.stopHealthCheck();

    if (this.state === 'connected') {
      await this.doDisconnect();
    }

    this.state = 'disconnected';
    this.connectedAt = null;
    this.emit('disconnected');
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Get connection state
   */
  public getState(): ResourceState {
    return this.state;
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<ResourceHealth> {
    if (!this.isConnected()) {
      return 'unhealthy';
    }

    try {
      const healthy = await this.doHealthCheck();
      return healthy ? 'healthy' : 'degraded';
    } catch {
      return 'unhealthy';
    }
  }

  /**
   * Get resource statistics
   */
  public getStats(): ResourceStats {
    return {
      ...this.stats,
      uptime: this.connectedAt !== null ? Date.now() - this.connectedAt : 0,
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      connections: this.stats.connections,
      activeConnections: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 0,
    };
  }

  /**
   * Track request metrics
   */
  protected trackRequest(responseTime: number, success: boolean): void {
    this.stats.totalRequests++;
    if (!success) {
      this.stats.failedRequests++;
    }

    // Update average response time
    const totalTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
    this.stats.averageResponseTime = (totalTime + responseTime) / this.stats.totalRequests;
  }

  /**
   * Actual connection implementation
   */
  protected abstract doConnect(): Promise<void>;

  /**
   * Actual disconnection implementation
   */
  protected abstract doDisconnect(): Promise<void>;

  /**
   * Actual health check implementation
   */
  protected abstract doHealthCheck(): Promise<boolean>;

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval > 0) {
      this.healthCheckTimer = setInterval(() => {
        void this.healthCheck().then((health) => {
          this.emit('health:check', health);

          if (health === 'unhealthy') {
            this.emit('health:unhealthy');
          }
        });
      }, this.healthCheckInterval);
    }
  }

  /**
   * Stop health checks
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer !== null) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
