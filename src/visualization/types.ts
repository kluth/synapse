/**
 * Types for visualization components
 */

import type { SkinCellProps, SkinCellState } from '../ui/types';

/**
 * Base visualization data point
 */
export interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Data bounds for chart scaling
 */
export interface DataBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Canvas/Screen coordinates
 */
export interface CanvasPoint {
  x: number;
  y: number;
}

/**
 * Base visualization props
 */
export interface BaseVisualizationProps extends SkinCellProps {
  data: ChartDataPoint[];
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showGrid?: boolean;
  showAxes?: boolean;
  animate?: boolean;
}

/**
 * Line visualization specific props
 */
export interface LineVisualizationProps extends BaseVisualizationProps {
  lineWidth?: number;
  smooth?: boolean;
  showPoints?: boolean;
  pointRadius?: number;
  fill?: boolean;
  fillOpacity?: number;
}

/**
 * Bar visualization specific props
 */
export interface BarVisualizationProps extends BaseVisualizationProps {
  barWidth?: number | 'auto';
  barSpacing?: number;
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
}

/**
 * Pie visualization data point
 */
export interface PieDataPoint {
  value: number;
  label: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Pie visualization specific props
 */
export interface PieVisualizationProps extends SkinCellProps {
  data: PieDataPoint[];
  width: number;
  height: number;
  innerRadius?: number; // For donut charts
  showLabels?: boolean;
  showPercentages?: boolean;
}

/**
 * Scatter visualization specific props
 */
export interface ScatterVisualizationProps extends BaseVisualizationProps {
  pointRadius?: number;
  pointShape?: 'circle' | 'square' | 'triangle';
  sizeField?: string; // Field name for bubble charts
}

/**
 * Base visualization state
 */
export interface BaseVisualizationState extends SkinCellState {
  hoveredPoint: ChartDataPoint | null;
  selectedPoint: ChartDataPoint | null;
  isAnimating?: boolean;
}

/**
 * Pie visualization state
 */
export interface PieVisualizationState extends SkinCellState {
  hoveredSlice: PieDataPoint | null;
  selectedSlice: PieDataPoint | null;
  isAnimating?: boolean;
}

/**
 * Visualization theme
 */
export interface VisualizationTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  gridColor: string;
  axisColor: string;
  textColor: string;
  fontFamily: string;
}

/**
 * SVG element for chart rendering
 */
export interface SVGElement {
  tag: string;
  props: Record<string, any>;
  children?: Array<SVGElement | string>;
}
