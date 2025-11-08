/**
 * HotReload - File Watching and Live Reload System
 *
 * The HotReload system watches files for changes and triggers reload events
 * to keep the development environment synchronized with source code changes.
 *
 * Medical Metaphor: Like a monitoring system in a medical theater that
 * continuously tracks vital signs and alerts observers to any changes.
 */

import { EventEmitter } from 'events';

/**
 * Watch pattern
 */
export interface WatchPattern {
  /** Pattern to watch (glob) */
  pattern: string;

  /** File types to watch */
  extensions?: string[];

  /** Ignore patterns */
  ignore?: string[];
}

/**
 * File change event
 */
export interface FileChangeEvent {
  /** Event type */
  type: 'added' | 'changed' | 'removed';

  /** File path */
  path: string;

  /** Change timestamp */
  timestamp: number;

  /** File size (for added/changed) */
  size?: number;
}

/**
 * Hot reload configuration
 */
export interface HotReloadConfig {
  /** Watch patterns */
  patterns?: WatchPattern[];

  /** Debounce delay in ms */
  debounce?: number;

  /** Enable file watching */
  enabled?: boolean;

  /** Ignore patterns */
  ignore?: string[];

  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Watch statistics
 */
export interface WatchStatistics {
  /** Total file changes detected */
  totalChanges: number;

  /** Changes by type */
  byType: {
    added: number;
    changed: number;
    removed: number;
  };

  /** Files being watched */
  watchedFiles: number;

  /** Last change timestamp */
  lastChange: number;
}

/**
 * HotReload - File Watching System
 *
 * @example
 * ```typescript
 * const hotReload = new HotReload({
 *   patterns: [
 *     { pattern: 'src/specimens/**\/*.ts' },
 *     { pattern: 'src/components/**\/*.ts' }
 *   ],
 *   debounce: 300
 * });
 *
 * hotReload.on('change', (event) => {
 *   console.log(`File ${event.type}: ${event.path}`);
 *   server.triggerReload(event.path);
 * });
 *
 * await hotReload.start();
 * ```
 */
export class HotReload extends EventEmitter {
  private readonly config: Required<HotReloadConfig>;
  private watching: boolean = false;
  private statistics: WatchStatistics;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private watchedFiles: Set<string> = new Set();

  constructor(config: HotReloadConfig = {}) {
    super();

    this.config = {
      patterns: config.patterns ?? [],
      debounce: config.debounce ?? 300,
      enabled: config.enabled ?? true,
      ignore: config.ignore ?? ['node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
      verbose: config.verbose ?? false,
    };

    this.statistics = {
      totalChanges: 0,
      byType: {
        added: 0,
        changed: 0,
        removed: 0,
      },
      watchedFiles: 0,
      lastChange: 0,
    };
  }

  /**
   * Start watching files
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async start(): Promise<void> {
    if (this.watching) {
      throw new Error('Hot reload is already watching');
    }

    if (!this.config.enabled) {
      return;
    }

    this.watching = true;
    this.emit('started');

    if (this.config.verbose) {
      this.log('Hot reload started');
      this.log(`Watching ${this.config.patterns.length} patterns`);
    }

    // In a real implementation, would set up file watchers using chokidar or similar
    // For now, just emit started event
  }

  /**
   * Stop watching files
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async stop(): Promise<void> {
    if (!this.watching) {
      return;
    }

    this.watching = false;

    // Clear all debounce timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();

    this.emit('stopped');

    if (this.config.verbose) {
      this.log('Hot reload stopped');
    }
  }

  /**
   * Add watch pattern
   */
  public addPattern(pattern: WatchPattern): void {
    this.config.patterns.push(pattern);

    if (this.watching) {
      // In real implementation, would add new watcher
      this.emit('pattern:added', { pattern });
    }
  }

  /**
   * Remove watch pattern
   */
  public removePattern(pattern: string): void {
    const index = this.config.patterns.findIndex((p) => p.pattern === pattern);
    if (index !== -1) {
      this.config.patterns.splice(index, 1);
      this.emit('pattern:removed', { pattern });
    }
  }

  /**
   * Handle file change
   */
  public handleChange(event: FileChangeEvent): void {
    // Update statistics
    this.statistics.totalChanges++;
    this.statistics.byType[event.type]++;
    this.statistics.lastChange = event.timestamp;

    // Update watched files
    if (event.type === 'added') {
      this.watchedFiles.add(event.path);
    } else if (event.type === 'removed') {
      this.watchedFiles.delete(event.path);
    }

    this.statistics.watchedFiles = this.watchedFiles.size;

    // Debounce the change event
    this.debounceChange(event);
  }

  /**
   * Debounce file change event
   */
  private debounceChange(event: FileChangeEvent): void {
    const { path } = event;

    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(path);
      this.emit('change', event);

      if (this.config.verbose) {
        this.log(`File ${event.type}: ${event.path}`);
      }
    }, this.config.debounce);

    this.debounceTimers.set(path, timer);
  }

  /**
   * Check if file matches ignore patterns
   */
  public shouldIgnore(path: string): boolean {
    return this.config.ignore.some((pattern) => {
      // Simple pattern matching (in real impl, would use minimatch or similar)
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(path);
    });
  }

  /**
   * Get watch statistics
   */
  public getStatistics(): WatchStatistics {
    return { ...this.statistics };
  }

  /**
   * Get watched files
   */
  public getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles);
  }

  /**
   * Check if watching
   */
  public isWatching(): boolean {
    return this.watching;
  }

  /**
   * Clear statistics
   */
  public clearStatistics(): void {
    this.statistics = {
      totalChanges: 0,
      byType: {
        added: 0,
        changed: 0,
        removed: 0,
      },
      watchedFiles: this.watchedFiles.size,
      lastChange: 0,
    };
  }

  /**
   * Log message
   */
  private log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`[HotReload] ${message}`);
  }

  /**
   * Trigger manual reload
   */
  public triggerReload(path: string, reason: string = 'Manual trigger'): void {
    const event: FileChangeEvent = {
      type: 'changed',
      path,
      timestamp: Date.now(),
    };

    this.emit('change', event);
    this.emit('manual:reload', { path, reason });

    if (this.config.verbose) {
      this.log(`Manual reload: ${path} (${reason})`);
    }
  }
}
