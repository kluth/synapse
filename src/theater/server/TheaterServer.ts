/**
 * TheaterServer - Development Server
 *
 * The TheaterServer provides a development server for The Anatomy Theater,
 * serving the UI, handling hot reload, and providing real-time updates.
 *
 * Medical Metaphor: Like a medical theater's infrastructure that supports
 * live demonstrations and observations with proper lighting, seating, and
 * viewing capabilities.
 */

import { EventEmitter } from 'events';
import type { Server } from 'http';

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Server port */
  port?: number;

  /** Host address */
  host?: string;

  /** Enable hot reload */
  hotReload?: boolean;

  /** WebSocket port (defaults to port + 1) */
  wsPort?: number;

  /** Specimen directory */
  specimenDir?: string;

  /** Public directory for static assets */
  publicDir?: string;

  /** Enable CORS */
  cors?: boolean;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Server state
 */
export type ServerState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * Server statistics
 */
export interface ServerStatistics {
  /** Total requests handled */
  totalRequests: number;

  /** Active WebSocket connections */
  activeConnections: number;

  /** Hot reload triggers */
  reloadCount: number;

  /** Uptime in milliseconds */
  uptime: number;

  /** Server start time */
  startTime: number;
}

/**
 * Request information
 */
export interface RequestInfo {
  /** Request method */
  method: string;

  /** Request path */
  path: string;

  /** Request timestamp */
  timestamp: number;

  /** Response status code */
  statusCode?: number;

  /** Response time in ms */
  responseTime?: number;
}

/**
 * TheaterServer - Development Server
 *
 * @example
 * ```typescript
 * const server = new TheaterServer({
 *   port: 6006,
 *   hotReload: true,
 *   specimenDir: './src/specimens'
 * });
 *
 * await server.start();
 *
 * // Server is running...
 *
 * await server.stop();
 * ```
 */
export class TheaterServer extends EventEmitter {
  private readonly config: Required<ServerConfig>;
  private state: ServerState = 'stopped';
  // @ts-expect-error - Server placeholder for future HTTP server implementation
  private _server: Server | null = null;
  private statistics: ServerStatistics;
  private requests: RequestInfo[] = [];

  constructor(config: ServerConfig = {}) {
    super();

    this.config = {
      port: config.port ?? 6006,
      host: config.host ?? 'localhost',
      hotReload: config.hotReload ?? true,
      wsPort: config.wsPort ?? (config.port ?? 6006) + 1,
      specimenDir: config.specimenDir ?? './specimens',
      publicDir: config.publicDir ?? './public',
      cors: config.cors ?? true,
      verbose: config.verbose ?? false,
    };

    this.statistics = {
      totalRequests: 0,
      activeConnections: 0,
      reloadCount: 0,
      uptime: 0,
      startTime: 0,
    };
  }

  /**
   * Start the server
   */

  public async start(): Promise<void> {
    if (this.state !== 'stopped') {
      throw new Error(`Cannot start server in ${this.state} state`);
    }

    this.state = 'starting';
    this.emit('state:change', { from: 'stopped', to: 'starting' });

    try {
      // Create HTTP server (placeholder - would use actual HTTP module)
      // For now, just simulate server creation
      this._server = {} as Server;

      this.statistics.startTime = Date.now();
      this.state = 'running';

      this.emit('started', {
        port: this.config.port,
        host: this.config.host,
        url: `http://${this.config.host}:${this.config.port}`,
      });

      this.emit('state:change', { from: 'starting', to: 'running' });

      if (this.config.verbose) {
        this.log(`Server started on http://${this.config.host}:${this.config.port}`);
      }
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the server
   */

  public async stop(): Promise<void> {
    if (this.state !== 'running') {
      throw new Error(`Cannot stop server in ${this.state} state`);
    }

    this.state = 'stopping';
    this.emit('state:change', { from: 'running', to: 'stopping' });

    try {
      // Close server (placeholder)
      this._server = null;

      this.state = 'stopped';
      this.emit('stopped');
      this.emit('state:change', { from: 'stopping', to: 'stopped' });

      if (this.config.verbose) {
        this.log('Server stopped');
      }
    } catch (error) {
      this.state = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Restart the server
   */
  public async restart(): Promise<void> {
    if (this.state === 'running') {
      await this.stop();
    }
    await this.start();
  }

  /**
   * Get server state
   */
  public getState(): ServerState {
    return this.state;
  }

  /**
   * Get server configuration
   */
  public getConfig(): Readonly<Required<ServerConfig>> {
    return { ...this.config };
  }

  /**
   * Get server statistics
   */
  public getStatistics(): ServerStatistics {
    const uptime = this.state === 'running' ? Date.now() - this.statistics.startTime : 0;

    return {
      ...this.statistics,
      uptime,
    };
  }

  /**
   * Get recent requests
   */
  public getRequests(limit: number = 100): RequestInfo[] {
    return this.requests.slice(-limit);
  }

  /**
   * Record a request
   */
  public recordRequest(request: RequestInfo): void {
    this.requests.push(request);
    this.statistics.totalRequests++;

    // Limit request history
    if (this.requests.length > 1000) {
      this.requests = this.requests.slice(-1000);
    }

    this.emit('request', request);

    if (this.config.verbose) {
      this.log(`${request.method} ${request.path} - ${request.statusCode ?? 'pending'}`);
    }
  }

  /**
   * Increment active connections
   */
  public incrementConnections(): void {
    this.statistics.activeConnections++;
    this.emit('connection:opened', {
      active: this.statistics.activeConnections,
    });
  }

  /**
   * Decrement active connections
   */
  public decrementConnections(): void {
    this.statistics.activeConnections = Math.max(0, this.statistics.activeConnections - 1);
    this.emit('connection:closed', {
      active: this.statistics.activeConnections,
    });
  }

  /**
   * Trigger hot reload
   */
  public triggerReload(reason: string = 'File changed'): void {
    if (!this.config.hotReload) {
      return;
    }

    this.statistics.reloadCount++;
    this.emit('reload', { reason, count: this.statistics.reloadCount });

    if (this.config.verbose) {
      this.log(`Hot reload triggered: ${reason}`);
    }
  }

  /**
   * Get server URL
   */
  public getUrl(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  /**
   * Get WebSocket URL
   */
  public getWebSocketUrl(): string {
    return `ws://${this.config.host}:${this.config.wsPort}`;
  }

  /**
   * Check if server is running
   */
  public isRunning(): boolean {
    return this.state === 'running';
  }

  /**
   * Log message
   */
  private log(message: string): void {
    console.log(`[TheaterServer] ${message}`);
  }

  /**
   * Clear statistics
   */
  public clearStatistics(): void {
    this.statistics = {
      totalRequests: 0,
      activeConnections: this.statistics.activeConnections, // Keep active connections
      reloadCount: 0,
      uptime: 0,
      startTime: this.statistics.startTime,
    };
    this.requests = [];
  }
}
