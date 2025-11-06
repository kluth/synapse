/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
/**
 * VisualAstrocyte - UI State Management
 * Neural-inspired state manager with time-travel debugging (like Redux/Zustand)
 */

import { Astrocyte } from '../../glial/Astrocyte';

export interface VisualAstrocyteConfig {
  id: string;
  maxHistorySize?: number;
  enableTimeTravel?: boolean;
}

export interface StateSnapshot {
  timestamp: number;
  state: Record<string, any>;
}

export interface StateHistoryEntry {
  timestamp: number;
  state: Record<string, any>;
  action?: string;
}

type StateChangeCallback = (newValue: any, oldValue: any) => void;
type StateMiddleware = (path: string, value: any, prevValue?: any) => any;
type Selector = (state: Record<string, any>) => any;

/**
 * VisualAstrocyte - Manages global UI state with time-travel debugging
 */
export class VisualAstrocyte extends Astrocyte {
  private uiState: Record<string, any> = {};
  private subscribers: Map<string, Set<StateChangeCallback>> = new Map();
  private selectors: Map<string, Selector> = new Map();
  private selectorCache: Map<string, { value: any; stateHash: string }> = new Map();
  private middleware: StateMiddleware[] = [];

  // Time-travel debugging
  private history: StateHistoryEntry[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number;
  private enableTimeTravel: boolean;

  // Lifecycle state
  private status: 'inactive' | 'active' | 'failed' = 'inactive';

  constructor(config: VisualAstrocyteConfig) {
    super({
      id: config.id,
      cacheSize: 1000,
      ttl: 3600000, // 1 hour
    });

    this.maxHistorySize = config.maxHistorySize || 50;
    this.enableTimeTravel = config.enableTimeTravel ?? true;
  }

  /**
   * Activate the state manager
   */
  public override async activate(): Promise<void> {
    await super.activate();
    this.status = 'active';
  }

  /**
   * Deactivate the state manager (calls parent's shutdown)
   */
  public async deactivate(): Promise<void> {
    this.status = 'inactive';
    this.subscribers.clear();
    this.selectors.clear();
    this.selectorCache.clear();
    await super.shutdown();
  }

  /**
   * Get current status
   */
  public getStatus(): string {
    return this.status;
  }

  /**
   * Get the entire state or a specific path
   */
  public getState(path?: string): any {
    if (!path) {
      return { ...this.uiState };
    }

    return this.getNestedValue(this.uiState, path);
  }

  /**
   * Set state at a specific path
   */
  public setState(path: string, value: any): void {
    if (!path) return;

    const oldValue = this.getNestedValue(this.uiState, path);

    // Apply middleware
    let transformedValue = value;
    for (const mw of this.middleware) {
      transformedValue = mw(path, transformedValue, oldValue);
    }

    // Update state
    this.setNestedValue(this.uiState, path, transformedValue);

    // Record in history
    if (this.enableTimeTravel) {
      this.recordHistory(`setState: ${path}`);
    }

    // Invalidate selector cache
    this.selectorCache.clear();

    // Notify subscribers
    this.notifySubscribers(path, transformedValue, oldValue);
  }

  /**
   * Delete state at a specific path
   */
  public deleteState(path: string): void {
    if (!path) return;

    const oldValue = this.getNestedValue(this.uiState, path);
    this.deleteNestedValue(this.uiState, path);

    if (this.enableTimeTravel) {
      this.recordHistory(`deleteState: ${path}`);
    }

    this.selectorCache.clear();
    this.notifySubscribers(path, undefined, oldValue);
  }

  /**
   * Reset entire state
   */
  public resetState(): void {
    this.uiState = {};

    if (this.enableTimeTravel) {
      this.recordHistory('resetState');
    }

    this.selectorCache.clear();
    this.notifyAllSubscribers();
  }

  /**
   * Subscribe to state changes at a path
   * Returns unsubscribe function
   */
  public subscribe(path: string, callback: StateChangeCallback): () => void {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }

    this.subscribers.get(path)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(path);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  }

  /**
   * Register a selector for derived state
   */
  public registerSelector(name: string, selector: Selector): void {
    this.selectors.set(name, selector);
  }

  /**
   * Select derived state (memoized)
   */
  public select(name: string): any {
    const selector = this.selectors.get(name);
    if (!selector) {
      throw new Error(`Selector '${name}' not found`);
    }

    // Check cache
    const stateHash = this.hashState(this.uiState);
    const cached = this.selectorCache.get(name);

    if (cached?.stateHash === stateHash) {
      return cached.value;
    }

    // Compute and cache
    const value = selector(this.uiState);
    this.selectorCache.set(name, { value, stateHash });

    return value;
  }

  /**
   * Add middleware for state transformations
   */
  public addMiddleware(middleware: StateMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Get state history
   */
  public getHistory(): StateHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Undo last state change
   */
  public undo(): void {
    if (!this.enableTimeTravel || this.historyIndex <= 0) {
      return;
    }

    this.historyIndex--;
    this.restoreFromHistory(this.historyIndex);
  }

  /**
   * Redo state change
   */
  public redo(): void {
    if (!this.enableTimeTravel || this.historyIndex >= this.history.length - 1) {
      return;
    }

    this.historyIndex++;
    this.restoreFromHistory(this.historyIndex);
  }

  /**
   * Jump to specific history index
   */
  public jumpToState(index: number): void {
    if (!this.enableTimeTravel || index < 0 || index >= this.history.length) {
      return;
    }

    this.historyIndex = index;
    this.restoreFromHistory(index);
  }

  /**
   * Export state snapshot
   */
  public exportSnapshot(): StateSnapshot {
    try {
      return {
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(this.uiState)),
      };
    } catch {
      // Circular reference - return shallow copy
      return {
        timestamp: Date.now(),
        state: { ...this.uiState },
      };
    }
  }

  /**
   * Import state snapshot
   */
  public importSnapshot(snapshot: StateSnapshot): void {
    try {
      this.uiState = JSON.parse(JSON.stringify(snapshot.state));
    } catch {
      // Circular reference - use shallow copy
      this.uiState = { ...snapshot.state };
    }

    if (this.enableTimeTravel) {
      this.recordHistory('importSnapshot');
    }

    this.selectorCache.clear();
    this.notifyAllSubscribers();
  }

  /**
   * Get nested value using path notation (e.g., "user.profile.name")
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested value using path notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Delete nested value using path notation
   */
  private deleteNestedValue(obj: any, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) return;
      current = current[key];
    }

    delete current[lastKey];
  }

  /**
   * Notify subscribers of state changes
   */
  private notifySubscribers(path: string, newValue: any, oldValue: any): void {
    // Exact path match
    const exactCallbacks = this.subscribers.get(path);
    if (exactCallbacks) {
      exactCallbacks.forEach((callback) => callback(newValue, oldValue));
    }

    // Wildcard matches (e.g., "user.*" matches "user.name")
    for (const [subscriberPath, callbacks] of this.subscribers.entries()) {
      if (subscriberPath.includes('*')) {
        const pattern = subscriberPath.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(path)) {
          callbacks.forEach((callback) => callback(newValue, oldValue));
        }
      }
    }
  }

  /**
   * Notify all subscribers (used for reset)
   */
  private notifyAllSubscribers(): void {
    for (const [path, callbacks] of this.subscribers.entries()) {
      const value = this.getNestedValue(this.uiState, path);
      callbacks.forEach((callback) => callback(value, undefined));
    }
  }

  /**
   * Record state in history
   */
  private recordHistory(action: string): void {
    // Clear redo stack if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new entry - handle circular references gracefully
    try {
      this.history.push({
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(this.uiState)),
        action,
      });
    } catch {
      // If state has circular references, store a shallow copy instead
      this.history.push({
        timestamp: Date.now(),
        state: { ...this.uiState },
        action,
      });
    }

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    this.historyIndex = this.history.length - 1;
  }

  /**
   * Restore state from history
   */
  private restoreFromHistory(index: number): void {
    const entry = this.history[index];
    if (!entry) return;

    try {
      this.uiState = JSON.parse(JSON.stringify(entry.state));
    } catch {
      // Circular reference - use shallow copy
      this.uiState = { ...entry.state };
    }
    this.selectorCache.clear();
    this.notifyAllSubscribers();
  }

  /**
   * Hash state for memoization
   */
  private hashState(obj: any): string {
    try {
      return JSON.stringify(obj);
    } catch {
      // Circular reference - use timestamp as unique hash
      return String(Date.now()) + Math.random();
    }
  }
}
