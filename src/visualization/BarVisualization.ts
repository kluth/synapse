/**
 * BarChart visualization component
 * Extends VisualNeuron to create a neural-inspired bar chart
 */

import { SkinCell } from '../ui/SkinCell';
import type { RenderSignal } from '../ui/types';
import type {
  BarVisualizationProps,
  BaseVisualizationState,
  ChartDataPoint,
  DataBounds,
  CanvasPoint,
  SVGElement,
} from './types';

interface BarPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  dataPoint: ChartDataPoint;
}

export class BarVisualization extends SkinCell<BarVisualizationProps, BaseVisualizationState> {
  /**
   * Calculate data bounds for scaling
   */
  public getDataBounds(): DataBounds {
    const { data } = this.getProps();

    if (!data || data.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const xValues = data.map((d: ChartDataPoint) => d.x);
    const yValues = data.map((d: ChartDataPoint) => d.y);

    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues, 0), // Include 0 for baseline
      maxY: Math.max(...yValues),
    };
  }

  /**
   * Calculate bar width
   */
  public calculateBarWidth(): number {
    const { barWidth, data, width, padding, barSpacing } = this.getProps();

    // Use custom bar width if provided
    if (typeof barWidth === 'number') {
      return barWidth;
    }

    // Calculate automatic bar width
    const effectivePadding = padding || {
      top: 20,
      right: 20,
      bottom: 40,
      left: 60,
    };

    const effectiveSpacing = barSpacing || 4;
    const chartWidth = width - effectivePadding.left - effectivePadding.right;
    const availableWidth = chartWidth - (data.length - 1) * effectiveSpacing;
    const autoWidth = Math.max(availableWidth / data.length, 1);

    return autoWidth;
  }

  /**
   * Calculate positions for all bars
   */
  public calculateBarPositions(): BarPosition[] {
    const { data, orientation, padding } = this.getProps();

    if (!data || data.length === 0) {
      return [];
    }

    const effectivePadding = padding || {
      top: 20,
      right: 20,
      bottom: 40,
      left: 60,
    };

    const bounds = this.getDataBounds();
    const barWidth = this.calculateBarWidth();
    const barSpacing = this.receptiveField.barSpacing || 4;

    if (orientation === 'horizontal') {
      return this.calculateHorizontalBarPositions(
        data,
        bounds,
        effectivePadding,
        barWidth,
        barSpacing,
      );
    } else {
      return this.calculateVerticalBarPositions(
        data,
        bounds,
        effectivePadding,
        barWidth,
        barSpacing,
      );
    }
  }

  /**
   * Calculate vertical bar positions
   */
  private calculateVerticalBarPositions(
    data: ChartDataPoint[],
    bounds: DataBounds,
    padding: { top: number; right: number; bottom: number; left: number },
    barWidth: number,
    barSpacing: number,
  ): BarPosition[] {
    const { height } = this.getProps();
    const chartHeight = height - padding.top - padding.bottom;

    const yRange = bounds.maxY - bounds.minY || 1;
    const positions: BarPosition[] = [];

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      if (!point) continue;
      const x = padding.left + i * (barWidth + barSpacing);

      // Handle negative values
      const barHeight = Math.abs((point.y - bounds.minY) / yRange) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      positions.push({
        x,
        y,
        width: barWidth,
        height: barHeight,
        dataPoint: point,
      });
    }

    return positions;
  }

  /**
   * Calculate horizontal bar positions
   */
  private calculateHorizontalBarPositions(
    data: ChartDataPoint[],
    bounds: DataBounds,
    padding: { top: number; right: number; bottom: number; left: number },
    barHeight: number,
    barSpacing: number,
  ): BarPosition[] {
    const { width } = this.getProps();
    const chartWidth = width - padding.left - padding.right;

    const positions: BarPosition[] = [];

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      if (!point) continue;
      const y = padding.top + i * (barHeight + barSpacing);

      // Handle negative values
      const barWidth = Math.abs((point.y - bounds.minY) / (bounds.maxY - bounds.minY)) * chartWidth;
      const x = padding.left;

      positions.push({
        x,
        y,
        width: barWidth,
        height: barHeight,
        dataPoint: point,
      });
    }

    return positions;
  }

  /**
   * Find bar at given canvas point
   */
  public findBarAtPoint(point: CanvasPoint): ChartDataPoint | null {
    const bars = this.calculateBarPositions();

    for (const bar of bars) {
      if (
        point.x >= bar.x &&
        point.x <= bar.x + bar.width &&
        point.y >= bar.y &&
        point.y <= bar.y + bar.height
      ) {
        return bar.dataPoint;
      }
    }

    return null;
  }

  /**
   * Handle point hover
   */
  public onPointHover(point: ChartDataPoint | null): void {
    this.setState({ ...this.getState(), hoveredPoint: point });
  }

  /**
   * Handle point click
   */
  public onPointClick(point: ChartDataPoint): void {
    this.setState({ ...this.getState(), selectedPoint: point });

    // Emit UI event
    this.emitUIEvent({
      type: 'ui:click',
      data: {
        payload: point,
        target: this.id,
      },
      strength: 1.0,
      timestamp: Date.now(),
    });
  }

  /**
   * Get data as accessible table
   */
  public getDataAsTable(): Array<{ x: number; y: number; label: string | undefined }> {
    const { data } = this.getProps();
    return data.map((d: ChartDataPoint) => ({ x: d.x, y: d.y, label: d.label }));
  }

  /**
   * Render the bar chart
   */
  protected performRender(): RenderSignal {
    const { width, height, color, data } = this.getProps();
    const { hoveredPoint, selectedPoint } = this.getState();
    const bars = this.calculateBarPositions();

    const children: Array<SVGElement | string> = [];

    // Add bars
    for (const bar of bars) {
      const barColor = bar.dataPoint.color || color || '#3b82f6';
      const isHovered = hoveredPoint === bar.dataPoint;
      const isSelected = selectedPoint === bar.dataPoint;

      children.push({
        tag: 'rect',
        props: {
          x: bar.x,
          y: bar.y,
          width: bar.width,
          height: bar.height,
          fill: barColor,
          opacity: isHovered ? 0.8 : isSelected ? 0.9 : 1.0,
          stroke: isSelected ? '#000' : 'none',
          strokeWidth: isSelected ? 2 : 0,
        },
      });
    }

    const vdom: SVGElement = {
      tag: 'svg',
      props: {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        role: 'img',
        'aria-label': `Bar chart with ${data.length} bars`,
      },
      children,
    };

    return {
      type: 'render',
      data: {
        vdom,
        styles: {},
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now(),
        },
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }

  /**
   * Process incoming signals
   */
  protected override async executeProcessing<TOutput = unknown>(_input: unknown): Promise<TOutput> {
    // Handle chart-specific signals here
    return undefined as TOutput;
  }
}
