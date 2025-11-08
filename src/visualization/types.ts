/**
 * Types for visualization components
 */

import type { ComponentProps, ComponentState } from '../ui/types';

/**
 * Base chart data point
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
 * Base chart props
 */
export interface BaseChartProps extends ComponentProps {
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
 * Line chart specific props
 */
export interface LineChartProps extends BaseChartProps {
  lineWidth?: number;
  smooth?: boolean;
  showPoints?: boolean;
  pointRadius?: number;
  fill?: boolean;
  fillOpacity?: number;
}

/**
 * Bar chart specific props
 */
export interface BarChartProps extends BaseChartProps {
  barWidth?: number | 'auto';
  barSpacing?: number;
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
}

/**
 * Pie chart data point
 */
export interface PieDataPoint {
  value: number;
  label: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Pie chart specific props
 */
export interface PieChartProps extends ComponentProps {
  data: PieDataPoint[];
  width: number;
  height: number;
  innerRadius?: number; // For donut charts
  showLabels?: boolean;
  showPercentages?: boolean;
}

/**
 * Scatter plot specific props
 */
export interface ScatterPlotProps extends BaseChartProps {
  pointRadius?: number;
  pointShape?: 'circle' | 'square' | 'triangle';
  sizeField?: string; // Field name for bubble charts
}

/**
 * Base chart state
 */
export interface BaseChartState extends ComponentState {
  hoveredPoint: ChartDataPoint | null;
  selectedPoint: ChartDataPoint | null;
  isAnimating?: boolean;
}

/**
 * Pie chart state
 */
export interface PieChartState extends ComponentState {
  hoveredSlice: PieDataPoint | null;
  selectedSlice: PieDataPoint | null;
  isAnimating?: boolean;
}

/**
 * Chart theme
 */
export interface ChartTheme {
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
