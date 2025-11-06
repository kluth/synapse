/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-useless-constructor, @typescript-eslint/no-floating-promises, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
/**
 * InterneuronUI - Container components that coordinate child components
 * Handles layout, composition, and event coordination
 */

import type { VisualNeuronConfig } from './VisualNeuron';
import { VisualNeuron } from './VisualNeuron';
import type { RenderSignal, ComponentProps, ComponentState } from './types';
import type { Signal } from '../types';

/**
 * InterneuronUI - Container/Layout component
 * Examples: Layout containers, lists, grids, panels
 */
export abstract class InterneuronUI<
  TProps extends ComponentProps = ComponentProps,
  TState extends ComponentState = ComponentState,
> extends VisualNeuron<TProps, TState> {
  // Child visual neurons
  protected children: VisualNeuron<any, any>[] = [];

  constructor(config: VisualNeuronConfig<TProps>) {
    super(config);
  }

  /**
   * Add a child neuron to this container
   */
  public addChild(child: VisualNeuron<any, any>): void {
    if (!this.children.find((c) => c.id === child.id)) {
      this.children.push(child);

      // Listen to child events for bubbling
      this.setupChildEventListeners(child);
    }
  }

  /**
   * Remove a child neuron from this container
   */
  public removeChild(childId: string): void {
    const index = this.children.findIndex((c) => c.id === childId);
    if (index !== -1) {
      const child = this.children[index];
      if (!child) return;
      this.teardownChildEventListeners(child);
      this.children.splice(index, 1);
    }
  }

  /**
   * Get all children
   */
  public getChildren(): VisualNeuron<any, any>[] {
    return [...this.children];
  }

  /**
   * Get a specific child by id
   */
  public getChild(childId: string): VisualNeuron<any, any> | undefined {
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
  protected setupChildEventListeners(child: VisualNeuron<any, any>): void {
    child.on('signal', (signal) => {
      // Handle event bubbling
      if (signal.data?.bubbles) {
        this.bubbleFromChild(signal);
      }

      // Handle state changes
      if (signal.type === 'state:update') {
        this.onChildStateChange(child.id, signal);
      }
    });
  }

  /**
   * Teardown event listeners for child
   */
  protected teardownChildEventListeners(_child: VisualNeuron<any, any>): void {
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
  public async bubbleFromChild(signal: any): Promise<void> {
    if (!signal.data?.bubbles) {
      return;
    }

    // Convert to base Signal type if needed
    if (!signal.id || !signal.sourceId) {
      const baseSignal: Signal = {
        id: crypto.randomUUID(),
        sourceId: this.id,
        type: 'excitatory',
        strength: signal.strength || 1.0,
        payload: signal,
        timestamp: new Date(signal.timestamp || Date.now()),
      };
      this.emit(baseSignal);
    } else {
      this.emit(signal);
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
   * Find child neurons by predicate
   */
  protected findChildren(
    predicate: (child: VisualNeuron<any, any>) => boolean,
  ): VisualNeuron<any, any>[] {
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
    const newOrder: VisualNeuron<any, any>[] = [];

    for (const id of childIds) {
      const child = this.children.find((c) => c.id === id);
      if (child) {
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
