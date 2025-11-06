/**
 * UI-specific type definitions for Synapse Visual Cortex
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Virtual DOM node representation
 */
export interface VirtualDOMNode {
  tag: string;
  props?: Record<string, any>;
  children?: (VirtualDOMNode | string)[];
  events?: Record<string, (event: any) => void>;
  key?: string | number;
}

/**
 * Computed CSS styles
 */
export interface ComputedStyles {
  [property: string]: string | number;
}

/**
 * Render signal emitted by visual neurons
 * Simplified to work with existing Signal infrastructure
 */
export interface RenderSignal {
  type: 'render';
  data: {
    vdom: VirtualDOMNode;
    styles: ComputedStyles;
    metadata?: RenderMetadata;
  };
  strength: number;
  timestamp: number;
}

/**
 * Render metadata for optimization
 */
export interface RenderMetadata {
  componentId: string;
  renderCount: number;
  lastRenderTime: number;
  shouldMemoize?: boolean;
}

/**
 * UI event signal types
 */
export type UIEventType =
  | 'ui:click'
  | 'ui:input'
  | 'ui:change'
  | 'ui:focus'
  | 'ui:blur'
  | 'ui:hover'
  | 'ui:keydown'
  | 'ui:keyup'
  | 'ui:submit'
  | 'ui:scroll'
  | 'ui:resize';

/**
 * UI event signal
 */
export interface UIEventSignal<T = any> {
  type: UIEventType;
  data: {
    domEvent?: Event;
    payload: T;
    target: string; // Component ID
    bubbles?: boolean;
  };
  strength: number;
  timestamp: number;
}

/**
 * State update signal
 */
export interface StateSignal<T = any> {
  type: 'state:update' | 'state:delete' | 'state:reset';
  data: {
    path: string;
    value: T;
    prevValue?: T;
  };
  strength: number;
  timestamp: number;
}

/**
 * Component props type
 */
export type ComponentProps = Record<string, any>;

/**
 * Component state type
 */
export type ComponentState = Record<string, any>;

/**
 * Render patch operations for Virtual DOM reconciliation
 */
export type PatchOperation =
  | { type: 'CREATE'; node: VirtualDOMNode; parentId?: string }
  | { type: 'UPDATE'; nodeId: string; props: Record<string, any> }
  | { type: 'DELETE'; nodeId: string }
  | { type: 'REPLACE'; nodeId: string; newNode: VirtualDOMNode }
  | { type: 'REORDER'; parentId: string; order: string[] };

/**
 * Virtual DOM tree
 */
export interface VirtualDOM {
  root: VirtualDOMNode;
  nodes: Map<string, VirtualDOMNode>;
}

/**
 * Accessibility needs
 */
export interface AccessibilityNeeds {
  screenReader?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  largeText?: boolean;
  keyboardOnly?: boolean;
}

/**
 * Accessibility violation
 */
export interface AccessibilityViolation {
  componentId: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: VirtualDOMNode;
}

/**
 * Performance metrics for rendering
 */
export interface RenderMetrics {
  componentId: string;
  renderTime: number;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTimestamp: number;
  memoryUsage?: number;
}

/**
 * User preferences learned through interaction
 */
export interface UserPreferences {
  userId: string;
  frequentActions: Map<string, number>;
  preferredTheme?: 'light' | 'dark';
  accessibilityNeeds?: AccessibilityNeeds;
  layoutPreferences?: Record<string, any>;
}

/**
 * Layout optimization suggestion
 */
export interface LayoutOptimization {
  componentId: string;
  suggestion: string;
  reasoning: string;
  expectedImprovement: number; // Percentage
}

/**
 * Usage metrics for adaptive UI
 */
export interface UsageMetrics {
  componentId: string;
  interactionCount: number;
  averageInteractionTime: number;
  errorRate: number;
  abandonmentRate: number;
}

/**
 * Navigation guard for routing
 */
export type NavigationGuard = (
  to: string,
  from: string,
  next: (proceed?: boolean) => void,
) => void | Promise<void>;

/**
 * Route definition
 */
export interface RouteDefinition {
  path: string;
  componentId: string;
  meta?: Record<string, any>;
  guards?: NavigationGuard[];
}
