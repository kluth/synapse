/**
 * ScatterPlot visualization component
 * Extends VisualNeuron to create a neural-inspired scatter plot with bubble chart support
 */

import { VisualNeuron } from '../ui/VisualNeuron';
import type { RenderSignal } from '../ui/types';
import type {
  ScatterPlotProps,
  BaseChartState,
  ChartDataPoint,
  DataBounds,
  CanvasPoint,
  SVGElement,
} from './types';

export class ScatterPlot extends VisualNeuron<ScatterPlotProps, BaseChartState> {
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

    const x =
      effectivePadding.left +
      ((point.x - bounds.minX) / xRange) * chartWidth;
    const y =
      effectivePadding.top +
      chartHeight -
      ((point.y - bounds.minY) / yRange) * chartHeight;

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

    const x =
      bounds.minX +
      ((point.x - effectivePadding.left) / chartWidth) * xRange;
    const y =
      bounds.minY +
      ((chartHeight - (point.y - effectivePadding.top)) / chartHeight) *
        yRange;

    return { x, y };
  }

  /**
   * Find nearest point to given canvas coordinates
   */
  public findNearestPoint(canvasPoint: CanvasPoint): ChartDataPoint | null {
    const { data } = this.receptiveField;

    if (!data || data.length === 0) {
      return null;
    }

    let nearestPoint = data[0];
    let minDistance = Infinity;

    for (const point of data) {
      const canvasCoords = this.dataToCanvas(point);
      const distance = Math.sqrt(
        Math.pow(canvasCoords.x - canvasPoint.x, 2) +
          Math.pow(canvasCoords.y - canvasPoint.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    return nearestPoint;
  }

  /**
   * Get point size (for bubble charts)
   */
  public getPointSize(point: ChartDataPoint): number {
    const { pointRadius, sizeField } = this.receptiveField;

    // Use default radius if no size field specified
    if (!sizeField || !point.metadata?.[sizeField]) {
      return pointRadius || 5;
    }

    // Scale size based on data
    const sizeValue = point.metadata[sizeField] as number;
    const { data } = this.receptiveField;

    // Find min and max sizes
    const sizes = data
      .map((d) => (d.metadata?.[sizeField] as number) || 0)
      .filter((s) => s > 0);

    if (sizes.length === 0) {
      return pointRadius || 5;
    }

    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    const sizeRange = maxSize - minSize || 1;

    // Scale to 5-20 pixel radius
    const minRadius = 5;
    const maxRadius = 20;
    const radiusRange = maxRadius - minRadius;

    return (
      minRadius + ((sizeValue - minSize) / sizeRange) * radiusRange
    );
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
  public getDataAsTable(): Array<{ x: number; y: number; label?: string }> {
    const { data } = this.receptiveField;
    return data.map((d) => ({ x: d.x, y: d.y, label: d.label }));
  }

  /**
   * Identify point clusters using simple distance-based clustering
   */
  public identifyClusters(distanceThreshold: number): ChartDataPoint[][] {
    const { data } = this.receptiveField;

    if (!data || data.length === 0) {
      return [];
    }

    const clusters: ChartDataPoint[][] = [];
    const visited = new Set<ChartDataPoint>();

    for (const point of data) {
      if (visited.has(point)) {
        continue;
      }

      const cluster: ChartDataPoint[] = [point];
      visited.add(point);

      // Find all nearby points
      for (const other of data) {
        if (visited.has(other)) {
          continue;
        }

        const distance = Math.sqrt(
          Math.pow(point.x - other.x, 2) + Math.pow(point.y - other.y, 2)
        );

        if (distance <= distanceThreshold) {
          cluster.push(other);
          visited.add(other);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Calculate point density (number of points within radius)
   */
  public calculateDensity(point: { x: number; y: number }, radius: number): number {
    const { data } = this.receptiveField;

    if (!data || data.length === 0) {
      return 0;
    }

    let count = 0;
    for (const dataPoint of data) {
      const distance = Math.sqrt(
        Math.pow(point.x - dataPoint.x, 2) +
          Math.pow(point.y - dataPoint.y, 2)
      );

      if (distance <= radius) {
        count++;
      }
    }

    return count;
  }

  /**
   * Render a circle point
   */
  private renderCirclePoint(
    point: ChartDataPoint,
    canvasPos: CanvasPoint,
    radius: number,
    isHovered: boolean,
    isSelected: boolean
  ): SVGElement {
    const { color } = this.receptiveField;

    return {
      tag: 'circle',
      props: {
        cx: canvasPos.x,
        cy: canvasPos.y,
        r: radius,
        fill: point.color || color || '#3b82f6',
        opacity: isHovered ? 0.8 : isSelected ? 0.9 : 1.0,
        stroke: isSelected ? '#000' : isHovered ? '#666' : '#fff',
        strokeWidth: isSelected ? 2 : isHovered ? 1.5 : 1,
      },
    };
  }

  /**
   * Render a square point
   */
  private renderSquarePoint(
    point: ChartDataPoint,
    canvasPos: CanvasPoint,
    size: number,
    isHovered: boolean,
    isSelected: boolean
  ): SVGElement {
    const { color } = this.receptiveField;
    const halfSize = size;

    return {
      tag: 'rect',
      props: {
        x: canvasPos.x - halfSize,
        y: canvasPos.y - halfSize,
        width: halfSize * 2,
        height: halfSize * 2,
        fill: point.color || color || '#3b82f6',
        opacity: isHovered ? 0.8 : isSelected ? 0.9 : 1.0,
        stroke: isSelected ? '#000' : isHovered ? '#666' : '#fff',
        strokeWidth: isSelected ? 2 : isHovered ? 1.5 : 1,
      },
    };
  }

  /**
   * Render a triangle point
   */
  private renderTrianglePoint(
    point: ChartDataPoint,
    canvasPos: CanvasPoint,
    size: number,
    isHovered: boolean,
    isSelected: boolean
  ): SVGElement {
    const { color } = this.receptiveField;
    const height = size * 1.5;
    const width = size * 1.3;

    const points = `
      ${canvasPos.x},${canvasPos.y - height}
      ${canvasPos.x - width},${canvasPos.y + height / 2}
      ${canvasPos.x + width},${canvasPos.y + height / 2}
    `.trim();

    return {
      tag: 'polygon',
      props: {
        points,
        fill: point.color || color || '#3b82f6',
        opacity: isHovered ? 0.8 : isSelected ? 0.9 : 1.0,
        stroke: isSelected ? '#000' : isHovered ? '#666' : '#fff',
        strokeWidth: isSelected ? 2 : isHovered ? 1.5 : 1,
      },
    };
  }

  /**
   * Render the scatter plot
   */
  protected performRender(): RenderSignal {
    const { width, height, data, pointShape } = this.receptiveField;

    const children: Array<SVGElement | string> = [];

    // Render points
    for (const point of data) {
      const canvasPos = this.dataToCanvas(point);
      const size = this.getPointSize(point);
      const isHovered = this.visualState.hoveredPoint === point;
      const isSelected = this.visualState.selectedPoint === point;

      let element: SVGElement;

      switch (pointShape) {
        case 'square':
          element = this.renderSquarePoint(
            point,
            canvasPos,
            size,
            isHovered,
            isSelected
          );
          break;
        case 'triangle':
          element = this.renderTrianglePoint(
            point,
            canvasPos,
            size,
            isHovered,
            isSelected
          );
          break;
        default:
          element = this.renderCirclePoint(
            point,
            canvasPos,
            size,
            isHovered,
            isSelected
          );
      }

      children.push(element);
    }

    const vdom: SVGElement = {
      tag: 'svg',
      props: {
        width,
        height,
        role: 'img',
        'aria-label': `Scatter plot with ${data.length} data points`,
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
  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: any
  ): Promise<TOutput> {
    // Handle chart-specific signals here
    return undefined as TOutput;
  }
}
