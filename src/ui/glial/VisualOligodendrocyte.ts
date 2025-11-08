/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
/**
 * VisualOligodendrocyte - Rendering Optimization & Myelination
 * Virtual DOM diffing, component memoization, lazy loading
 */

import { Oligodendrocyte } from '../../glial/Oligodendrocyte';
import type { VirtualDOMNode, PatchOperation, RenderMetrics } from '../types';

export interface VisualOligodendrocyteConfig {
  id: string;
  maxCacheSize?: number;
}

interface RenderCacheEntry {
  vdom: VirtualDOMNode;
  propsHash: string;
}

/**
 * VisualOligodendrocyte - Optimizes rendering performance
 */
export class VisualOligodendrocyte extends Oligodendrocyte {
  private renderCache: Map<string, RenderCacheEntry> = new Map();
  private renderMetrics: Map<string, RenderMetrics> = new Map();
  private lazyComponents: Map<string, { path: string; loaded: boolean }> = new Map();
  private componentUsage: Map<string, number> = new Map();
  private myelinatedComponents: Set<string> = new Set();
  private maxCacheSize: number;

  // Lifecycle state
  private status: 'inactive' | 'active' | 'failed' = 'inactive';

  constructor(config: VisualOligodendrocyteConfig) {
    super({
      id: config.id,
      maxConnections: 1000,
      connectionTTL: 3600000,
    });

    this.maxCacheSize = config.maxCacheSize ?? 100;
  }

  /**
   * Activate the rendering optimizer
   */
  public override async activate(): Promise<void> {
    await super.activate();
    this.status = 'active';
  }

  /**
   * Deactivate the rendering optimizer (calls parent's shutdown)
   */
  public async deactivate(): Promise<void> {
    this.status = 'inactive';
    this.renderCache.clear();
    this.renderMetrics.clear();
    this.componentUsage.clear();
    this.myelinatedComponents.clear();
    this.lazyComponents.clear();
    await super.shutdown();
  }

  /**
   * Get current status
   */
  public getStatus(): string {
    return this.status;
  }

  /**
   * Memoize component render result
   */
  public memoizeRender(componentId: string, vdom: VirtualDOMNode, props: any): void {
    const propsHash = this.hashProps(props);

    if (this.renderCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.renderCache.keys().next().value;
      if (firstKey !== undefined) this.renderCache.delete(firstKey);
    }

    this.renderCache.set(componentId, { vdom, propsHash });
  }

  /**
   * Get cached render if props match
   */
  public getCachedRender(componentId: string, props: any): VirtualDOMNode | null {
    const cached = this.renderCache.get(componentId);
    if (!cached) return null;

    const propsHash = this.hashProps(props);
    if (cached.propsHash !== propsHash) {
      return null;
    }

    return cached.vdom;
  }

  /**
   * Virtual DOM diff algorithm
   */
  public diff(oldTree: VirtualDOMNode, newTree: VirtualDOMNode): PatchOperation[] {
    const patches: PatchOperation[] = [];

    this.diffNodes(oldTree, newTree, '', patches);

    return patches;
  }

  /**
   * Recursive node diffing
   */
  private diffNodes(
    oldNode: VirtualDOMNode | string,
    newNode: VirtualDOMNode | string,
    nodeId: string,
    patches: PatchOperation[],
  ): void {
    // Both are strings (text nodes)
    if (typeof oldNode === 'string' && typeof newNode === 'string') {
      if (oldNode !== newNode) {
        patches.push({
          type: 'UPDATE',
          nodeId,
          props: { textContent: newNode },
        });
      }
      return;
    }

    // Type changed (text -> element or vice versa)
    if (typeof oldNode !== typeof newNode) {
      patches.push({
        type: 'REPLACE',
        nodeId,
        newNode: newNode as VirtualDOMNode,
      });
      return;
    }

    const oldElement = oldNode as VirtualDOMNode;
    const newElement = newNode as VirtualDOMNode;

    // Tag changed
    if (oldElement.tag !== newElement.tag) {
      patches.push({
        type: 'REPLACE',
        nodeId,
        newNode: newElement,
      });
      return;
    }

    // Props changed
    if (this.propsChanged(oldElement.props, newElement.props)) {
      patches.push({
        type: 'UPDATE',
        nodeId,
        props: newElement.props ?? {},
      });
    }

    // Diff children
    this.diffChildren(oldElement.children ?? [], newElement.children ?? [], nodeId, patches);
  }

  /**
   * Diff children arrays
   */
  private diffChildren(
    oldChildren: (VirtualDOMNode | string)[],
    newChildren: (VirtualDOMNode | string)[],
    parentId: string,
    patches: PatchOperation[],
  ): void {
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      const childId = `${parentId}.${i}`;

      if (oldChild === undefined && newChild !== undefined) {
        // New child
        patches.push({
          type: 'CREATE',
          node: newChild as VirtualDOMNode,
          parentId,
        });
      } else if (oldChild !== undefined && newChild === undefined) {
        // Removed child
        patches.push({
          type: 'DELETE',
          nodeId: childId,
        });
      } else if (oldChild !== undefined && newChild !== undefined) {
        // Potentially changed child
        this.diffNodes(oldChild, newChild, childId, patches);
      }
    }
  }

  /**
   * Check if props changed
   */
  private propsChanged(oldProps: any, newProps: any): boolean {
    const hasOldProps = oldProps !== undefined && oldProps !== null;
    const hasNewProps = newProps !== undefined && newProps !== null;

    if (!hasOldProps && !hasNewProps) return false;
    if (!hasOldProps || !hasNewProps) return true;

    const oldKeys = Object.keys(oldProps as object);
    const newKeys = Object.keys(newProps as object);

    if (oldKeys.length !== newKeys.length) return true;

    return oldKeys.some((key) => oldProps[key] !== newProps[key]);
  }

  /**
   * Record render time for performance tracking
   */
  public recordRenderTime(componentId: string, renderTime: number): void {
    let metrics = this.renderMetrics.get(componentId);

    if (!metrics) {
      metrics = {
        componentId,
        renderTime,
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderTimestamp: Date.now(),
      };
      this.renderMetrics.set(componentId, metrics);
    }

    metrics.renderCount++;
    metrics.renderTime = renderTime;
    metrics.lastRenderTimestamp = Date.now();

    // Update average
    const prevAvg = metrics.averageRenderTime;
    metrics.averageRenderTime =
      (prevAvg * (metrics.renderCount - 1) + renderTime) / metrics.renderCount;
  }

  /**
   * Get render metrics for a component
   */
  public getRenderMetrics(componentId: string): RenderMetrics | undefined {
    return this.renderMetrics.get(componentId);
  }

  /**
   * Get components that render slowly
   */
  public getSlowComponents(threshold: number): string[] {
    const slowComponents: string[] = [];

    for (const [id, metrics] of this.renderMetrics.entries()) {
      if (metrics.averageRenderTime > threshold) {
        slowComponents.push(id);
      }
    }

    return slowComponents;
  }

  /**
   * Mark component for lazy loading
   */
  public markLazyComponent(componentId: string, path: string): void {
    this.lazyComponents.set(componentId, { path, loaded: false });
  }

  /**
   * Check if component is lazy
   */
  public isLazyComponent(componentId: string): boolean {
    return this.lazyComponents.has(componentId);
  }

  /**
   * Mark component as loaded
   */
  public markComponentLoaded(componentId: string): void {
    const lazy = this.lazyComponents.get(componentId);
    if (lazy) {
      lazy.loaded = true;
    }
  }

  /**
   * Check if lazy component is loaded
   */
  public isComponentLoaded(componentId: string): boolean {
    return this.lazyComponents.get(componentId)?.loaded ?? false;
  }

  /**
   * Track component usage (for myelination)
   */
  public trackComponentUsage(componentId: string): void {
    const count = this.componentUsage.get(componentId) ?? 0;
    this.componentUsage.set(componentId, count + 1);
  }

  /**
   * Get frequently used components (hot paths)
   */
  public getHotComponents(minUsage: number): string[] {
    const hotComponents: string[] = [];

    for (const [id, count] of this.componentUsage.entries()) {
      if (count >= minUsage) {
        hotComponents.push(id);
      }
    }

    return hotComponents;
  }

  /**
   * Myelinate hot paths (optimize frequently used components)
   */
  public myelinateHotPaths(threshold: number): void {
    for (const [id, count] of this.componentUsage.entries()) {
      if (count >= threshold) {
        this.myelinatedComponents.add(id);
      }
    }
  }

  /**
   * Check if component is myelinated (optimized)
   */
  public isMyelinated(componentId: string): boolean {
    return this.myelinatedComponents.has(componentId);
  }

  /**
   * Hash props for memoization
   */
  private hashProps(props: any): string {
    try {
      return JSON.stringify(props);
    } catch {
      return String(Date.now());
    }
  }
}
