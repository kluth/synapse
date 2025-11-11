/**
 * LineChart visualization component
 * Extends VisualNeuron to create a neural-inspired line chart
 */

import { SkinCell } from '../ui/SkinCell';
import type { RenderSignal, SkinCellProps, SkinCellState } from '../ui/types';
import type {
  LineChartProps,
  BaseChartState,
  ChartDataPoint,
  DataBounds,
  CanvasPoint,
  SVGElement,
} from './types';

export class LineVisualization extends SkinCell<LineChartProps, BaseChartState> {
  /**
   * Calculate data bounds for scaling
   */
  public getDataBounds(): DataBounds {
    const { data } = this.receptiveField;

    if (!data || data.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const xValues = data.map((d) => d.x);
    const yValues = data.map((d) => d.y);

    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues),
    };
  }

  /**
   * Convert data coordinates to canvas coordinates
   */
  public dataToCanvas(point: { x: number; y: number }): CanvasPoint {
    const { width, height, padding } = this.receptiveField;
    const bounds = this.getDataBounds();

    const effectivePadding = padding || {
      top: 20,
      right: 20,
      bottom: 40,
      left: 60,
    };

    const chartWidth = width - effectivePadding.left - effectivePadding.right;
    const chartHeight = height - effectivePadding.top - effectivePadding.bottom;

    const xRange = bounds.maxX - bounds.minX || 1;
    const yRange = bounds.maxY - bounds.minY || 1;

    const x = effectivePadding.left + ((point.x - bounds.minX) / xRange) * chartWidth;
    const y = effectivePadding.top + chartHeight - ((point.y - bounds.minY) / yRange) * chartHeight;

    return { x, y };
  }

  /**
   * Convert canvas coordinates to data coordinates
   */
  public canvasToData(point: CanvasPoint): { x: number; y: number } {
    const { width, height, padding } = this.receptiveField;
    const bounds = this.getDataBounds();

    const effectivePadding = padding || {
      top: 20,
      right: 20,
      bottom: 40,
      left: 60,
    };

    const chartWidth = width - effectivePadding.left - effectivePadding.right;
    const chartHeight = height - effectivePadding.top - effectivePadding.bottom;

    const xRange = bounds.maxX - bounds.minX || 1;
    const yRange = bounds.maxY - bounds.minY || 1;

    const x = bounds.minX + ((point.x - effectivePadding.left) / chartWidth) * xRange;
    const y =
      bounds.minY + ((chartHeight - (point.y - effectivePadding.top)) / chartHeight) * yRange;

    return { x, y };
  }

  /**
   * Generate SVG path data for the line
   */
  public generatePathData(): string {
    const { data, smooth } = this.receptiveField;

    if (!data || data.length === 0) {
      return '';
    }

    if (data.length === 1) {
      const point = this.dataToCanvas(data[0]!);
      return `M ${point.x},${point.y}`;
    }

    const points = data.map((d) => this.dataToCanvas(d));

    if (smooth) {
      return this.generateSmoothPath(points);
    } else {
      return this.generateLinearPath(points);
    }
  }

  /**
   * Generate linear path (straight lines between points)
   */
  private generateLinearPath(points: CanvasPoint[]): string {
    if (points.length === 0) return '';
    const firstPoint = points[0];
    if (!firstPoint) return '';

    let path = `M ${firstPoint.x},${firstPoint.y}`;

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (point) {
        path += ` L ${point.x},${point.y}`;
      }
    }

    return path;
  }

  /**
   * Generate smooth path using cubic bezier curves
   */
  private generateSmoothPath(points: CanvasPoint[]): string {
    if (points.length === 0) return '';
    const firstPoint = points[0];
    if (!firstPoint) return '';
    if (points.length === 1) return `M ${firstPoint.x},${firstPoint.y}`;

    let path = `M ${firstPoint.x},${firstPoint.y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (!current || !next) continue;

      // Calculate control points for smooth curves
      const cpX1 = current.x + (next.x - current.x) / 3;
      const cpY1 = current.y;
      const cpX2 = current.x + (2 * (next.x - current.x)) / 3;
      const cpY2 = next.y;

      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${next.x},${next.y}`;
    }

    return path;
  }

  /**
   * Find nearest point to given canvas coordinates
   */
  public findNearestPoint(canvasPoint: CanvasPoint): ChartDataPoint | null {
    const { data } = this.receptiveField;

    if (!data || data.length === 0) {
      return null;
    }

    let nearestPoint: ChartDataPoint | null = data[0] || null;
    let minDistance = Infinity;

    for (const point of data) {
      const canvasCoords = this.dataToCanvas(point);
      const distance = Math.sqrt(
        Math.pow(canvasCoords.x - canvasPoint.x, 2) + Math.pow(canvasCoords.y - canvasPoint.y, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  }

  /**
   * Handle point hover
   */
  public onPointHover(point: ChartDataPoint | null): void {
    this.setState({ ...this.visualState, hoveredPoint: point });
  }

  /**
   * Handle point click
   */
  public onPointClick(point: ChartDataPoint): void {
    this.setState({ ...this.visualState, selectedPoint: point });

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
    const { data } = this.receptiveField;
    return data.map((d) => ({ x: d.x, y: d.y, label: d.label }));
  }

  /**
   * Render the line chart
   */
  protected performRender(): RenderSignal {
    const { width, height, color, lineWidth, showPoints, pointRadius } = this.receptiveField;
    const pathData = this.generatePathData();

    const children: Array<SVGElement | string> = [];

    // Add the line path
    children.push({
      tag: 'path',
      props: {
        d: pathData,
        stroke: color || '#3b82f6',
        'stroke-width': lineWidth || 2,
        strokeWidth: lineWidth || 2,
        fill: 'none',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
    });

    // Add points if enabled
    if (showPoints !== false) {
      const { data } = this.receptiveField;
      const radius = pointRadius || 4;

      for (const point of data) {
        const canvasPoint = this.dataToCanvas(point);
        children.push({
          tag: 'circle',
          props: {
            cx: canvasPoint.x,
            cy: canvasPoint.y,
            r: radius,
            fill: point.color || color || '#3b82f6',
            stroke: '#fff',
            strokeWidth: 2,
          },
        });
      }
    }

    const vdom: SVGElement = {
      tag: 'svg',
      props: {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        role: 'img',
        'aria-label': `Line chart with ${this.receptiveField.data.length} data points`,
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
