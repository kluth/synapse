/**
 * DermalLayer - Container components that coordinate child components
 * Handles layout, composition, and event coordination
 */

import { SkinCell } from './SkinCell';
import type { RenderSignal, DermalLayerProps, DermalLayerState } from './types';
import type { Signal } from '../types';

interface BubblingSignal {
  data?: {
    bubbles?: boolean;
    payload?: unknown;
    target?: string;
  };
  type?: string;
  strength?: number;
  timestamp?: number;
  id?: string;
  sourceId?: string;
}

/**
 * DermalLayer - Container/Layout component
 * Examples: Layout containers, lists, grids, panels
 */
export abstract class DermalLayer<
  TProps extends DermalLayerProps = DermalLayerProps,
  TState extends DermalLayerState = DermalLayerState,
> extends SkinCell<TProps, TState> {
  // Child skin cells
  protected children: SkinCell[] = [];

  /**
   * Add a child cell to this container
   */
  public addChild(child: SkinCell): void {
    if (this.children.find((c) => c.id === child.id) === undefined) {
      this.children.push(child);

      // Listen to child events for bubbling
      this.setupChildEventListeners(child);
    }
  }

  /**
   * Remove a child cell from this container
   */
  public removeChild(childId: string): void {
    const index = this.children.findIndex((c) => c.id === childId);
    if (index !== -1) {
      const child = this.children[index];
      if (child === undefined) return;
      this.teardownChildEventListeners(child);
      this.children.splice(index, 1);
    }
  }

  /**
   * Get all children
   */
  public getChildren(): SkinCell[] {
    return [...this.children];
  }

  /**
   * Get a specific child by id
   */
  public getChild(childId: string): SkinCell | undefined {
    return this.children.find((c) => c.id === childId);
  }

  /**
   * Clear all children
   */
  public clearChildren(): void {
    for (const child of this.children) {
      this.teardownChildEventListeners(child);
    }
    this.children = [];
  }

  /**
   * Setup event listeners for child
   */
  protected setupChildEventListeners(child: SkinCell): void {
    child.on('signal', (...args: unknown[]) => {
      const signal = args[0] as BubblingSignal;
      // Handle event bubbling
      if (signal.data?.bubbles === true) {
        this.bubbleFromChild(signal);
      }

      // Handle state changes
      if (signal.type === 'state:update') {
        this.onChildStateChange(child.id, signal as unknown as Signal);
      }
    });
  }

  /**
   * Teardown event listeners for child
   */
  protected teardownChildEventListeners(_child: SkinCell): void {
    // In a real implementation, we'd store listener references to remove them
    // For now, this is a placeholder
  }

  /**
   * Orchestrate children rendering
   * Returns render signals from all children
   */
  protected orchestrateChildren(): RenderSignal[] {
    return this.children.map((child) => child.render());
  }

  /**
   * Propagate signal to all children
   */
  public async propagateToChildren(signal: Signal): Promise<void> {
    await Promise.all(this.children.map((child) => child.receive(signal)));
  }

  /**
   * Bubble event from child to this container
   */
  public bubbleFromChild(signal: BubblingSignal): void {
    if (signal.data?.bubbles !== true) {
      return;
    }

    // Convert to base Signal type if needed
    if (signal.id === undefined || signal.sourceId === undefined) {
      const baseSignal: Signal = {
        id: crypto.randomUUID(),
        sourceId: this.id,
        type: 'excitatory',
        strength: signal.strength ?? 1.0,
        payload: signal.data?.payload ?? signal,
        timestamp: new Date(signal.timestamp ?? Date.now()),
      };
      this.emit(baseSignal);
    } else {
      // Signal has all required fields, cast it
      const fullSignal: Signal = {
        id: signal.id ?? crypto.randomUUID(),
        sourceId: signal.sourceId ?? this.id,
        type: 'excitatory',
        strength: signal.strength ?? 1.0,
        payload: signal.data?.payload ?? signal,
        timestamp: new Date(signal.timestamp ?? Date.now()),
      };
      this.emit(fullSignal);
    }

    // Re-emit locally for component event listeners
    this.emitter.emit('signal', signal);
  }

  /**
   * Hook: Called when a child's state changes
   */
  protected onChildStateChange(_childId: string, _signal: Signal): void {
    // Override in subclasses to react to child state changes
    // Default: trigger re-render
    this.requestRender();
  }

  /**
   * Activate container and all children
   */
  public override async activate(): Promise<void> {
    await super.activate();

    // Activate all children
    for (const child of this.children) {
      if (child.getStatus() === 'inactive') {
        await child.activate();
      }
    }
  }

  /**
   * Deactivate container and all children
   */
  public override async deactivate(): Promise<void> {
    // Deactivate all children first
    for (const child of this.children) {
      if (child.getStatus() !== 'inactive') {
        await child.deactivate();
      }
    }

    await super.deactivate();
  }

  /**
   * Find child skin cells by predicate
   */
  protected findChildren(predicate: (child: SkinCell) => boolean): SkinCell[] {
    return this.children.filter(predicate);
  }

  /**
   * Get child count
   */
  public getChildCount(): number {
    return this.children.length;
  }

  /**
   * Check if has children
   */
  public hasChildren(): boolean {
    return this.children.length > 0;
  }

  /**
   * Reorder children
   */
  public reorderChildren(childIds: string[]): void {
    const newOrder: SkinCell[] = [];

    for (const id of childIds) {
      const child = this.children.find((c) => c.id === id);
      if (child !== undefined) {
        newOrder.push(child);
      }
    }

    // Add any children not in the new order at the end
    for (const child of this.children) {
      if (!newOrder.includes(child)) {
        newOrder.push(child);
      }
    }

    this.children = newOrder;
  }
}
