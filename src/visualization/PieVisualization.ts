/**
 * PieChart visualization component
 * Extends VisualNeuron to create a neural-inspired pie/donut chart
 */

import { SkinCell } from '../ui/SkinCell';
import type { RenderSignal, SkinCellProps, SkinCellState } from '../ui/types';
import type { PieChartProps, PieChartState, PieDataPoint, SVGElement } from './types';

interface SliceAngle {
  dataPoint: PieDataPoint;
  startAngle: number;
  endAngle: number;
  percentage: number;
}

export class PieVisualization extends SkinCell<PieChartProps, PieChartState> {
  /**
   * Calculate total value of all slices
   */
  public calculateTotal(): number {
    const { data } = this.receptiveField;
    if (!data || data.length === 0) {
      return 0;
    }
    return data.reduce((sum, point) => sum + point.value, 0);
  }

  /**
   * Calculate percentage for each slice
   */
  public calculatePercentages(): number[] {
    const { data } = this.receptiveField;
    const total = this.calculateTotal();

    if (total === 0) {
      return data.map(() => 0);
    }

    return data.map((point) => (point.value / total) * 100);
  }

  /**
   * Calculate start and end angles for each slice
   */
  public calculateSliceAngles(): SliceAngle[] {
    const { data } = this.receptiveField;
    const percentages = this.calculatePercentages();

    let currentAngle = 0;
    const slices: SliceAngle[] = [];

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const percentage = percentages[i];
      if (point === undefined || percentage === undefined) continue;
      const angleSpan = (percentage / 100) * Math.PI * 2;

      slices.push({
        dataPoint: point,
        startAngle: currentAngle,
        endAngle: currentAngle + angleSpan,
        percentage,
      });

      currentAngle += angleSpan;
    }

    return slices;
  }

  /**
   * Calculate radius for the pie chart
   */
  public calculateRadius(): number {
    const { width, height } = this.receptiveField;
    const size = Math.min(width, height);
    const outerRadius = (size / 2) * 0.8; // 80% of available space

    return outerRadius;
  }

  /**
   * Convert polar coordinates to cartesian
   */
  private polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInRadians: number,
  ): { x: number; y: number } {
    return {
      x: centerX + radius * Math.cos(angleInRadians - Math.PI / 2),
      y: centerY + radius * Math.sin(angleInRadians - Math.PI / 2),
    };
  }

  /**
   * Generate SVG path for a pie slice
   */
  public generateSlicePath(
    slice: SliceAngle,
    outerRadius: number,
    innerRadius: number = 0,
  ): string {
    const { width, height } = this.receptiveField;
    const centerX = width / 2;
    const centerY = height / 2;

    const { startAngle, endAngle } = slice;

    // Handle full circle case
    if (endAngle - startAngle >= Math.PI * 2 - 0.001) {
      if (innerRadius > 0) {
        // Full donut
        return `
          M ${centerX} ${centerY - outerRadius}
          A ${outerRadius} ${outerRadius} 0 1 1 ${centerX} ${centerY + outerRadius}
          A ${outerRadius} ${outerRadius} 0 1 1 ${centerX} ${centerY - outerRadius}
          M ${centerX} ${centerY - innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 0 ${centerX} ${centerY + innerRadius}
          A ${innerRadius} ${innerRadius} 0 1 0 ${centerX} ${centerY - innerRadius}
          Z
        `.trim();
      } else {
        // Full circle
        return `
          M ${centerX} ${centerY}
          m 0 -${outerRadius}
          a ${outerRadius} ${outerRadius} 0 1 1 0 ${outerRadius * 2}
          a ${outerRadius} ${outerRadius} 0 1 1 0 -${outerRadius * 2}
          Z
        `.trim();
      }
    }

    const startOuter = this.polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const endOuter = this.polarToCartesian(centerX, centerY, outerRadius, endAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    if (innerRadius > 0) {
      // Donut slice
      const startInner = this.polarToCartesian(centerX, centerY, innerRadius, startAngle);
      const endInner = this.polarToCartesian(centerX, centerY, innerRadius, endAngle);

      return `
        M ${startOuter.x} ${startOuter.y}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
        L ${endInner.x} ${endInner.y}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}
        Z
      `.trim();
    } else {
      // Pie slice
      return `
        M ${centerX} ${centerY}
        L ${startOuter.x} ${startOuter.y}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}
        Z
      `.trim();
    }
  }

  /**
   * Calculate label position for a slice
   */
  public calculateLabelPosition(slice: SliceAngle, radius: number): { x: number; y: number } {
    const { width, height } = this.receptiveField;
    const centerX = width / 2;
    const centerY = height / 2;

    // Place label at the middle angle of the slice
    const midAngle = (slice.startAngle + slice.endAngle) / 2;

    // Position label at 70% of radius
    const labelRadius = radius * 0.7;

    return this.polarToCartesian(centerX, centerY, labelRadius, midAngle);
  }

  /**
   * Find slice at given angle
   */
  public findSliceAtAngle(angle: number): PieDataPoint | null {
    const slices = this.calculateSliceAngles();

    // Normalize angle to 0-2π
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    for (const slice of slices) {
      if (normalizedAngle >= slice.startAngle && normalizedAngle < slice.endAngle) {
        return slice.dataPoint;
      }
    }

    return null;
  }

  /**
   * Handle slice hover
   */
  public onSliceHover(slice: PieDataPoint | null): void {
    this.setState({ ...this.visualState, hoveredSlice: slice });
  }

  /**
   * Handle slice click
   */
  public onSliceClick(slice: PieDataPoint): void {
    this.setState({ ...this.visualState, selectedSlice: slice });

    // Emit UI event
    this.emitUIEvent({
      type: 'ui:click',
      data: {
        payload: slice,
        target: this.id,
      },
      strength: 1.0,
      timestamp: Date.now(),
    });
  }

  /**
   * Get data as accessible table
   */
  public getDataAsTable(): Array<{
    value: number;
    label: string;
    percentage: number;
  }> {
    const { data } = this.receptiveField;
    const percentages = this.calculatePercentages();

    return data.map((point, index) => ({
      value: point.value,
      label: point.label,
      percentage: percentages[index] || 0,
    }));
  }

  /**
   * Render the pie chart
   */
  protected performRender(): RenderSignal {
    const { width, height, innerRadius, showLabels, showPercentages } = this.receptiveField;

    const children: Array<SVGElement | string> = [];
    const slices = this.calculateSliceAngles();
    const outerRadius = this.calculateRadius();
    const effectiveInnerRadius = innerRadius || 0;

    // Render slices
    for (const slice of slices) {
      const isHovered = this.visualState.hoveredSlice === slice.dataPoint;
      const isSelected = this.visualState.selectedSlice === slice.dataPoint;

      const path = this.generateSlicePath(slice, outerRadius, effectiveInnerRadius);

      children.push({
        tag: 'path',
        props: {
          d: path,
          fill: slice.dataPoint.color || this.getDefaultColor(slices.indexOf(slice)),
          opacity: isHovered ? 0.8 : isSelected ? 0.9 : 1.0,
          stroke: isSelected ? '#000' : '#fff',
          strokeWidth: isSelected ? 3 : 1,
        },
      });
    }

    // Render labels if enabled
    if (showLabels || showPercentages) {
      for (const slice of slices) {
        const labelPos = this.calculateLabelPosition(slice, outerRadius);
        let labelText = '';

        if (showLabels && showPercentages) {
          labelText = `${slice.dataPoint.label} (${slice.percentage.toFixed(1)}%)`;
        } else if (showLabels) {
          labelText = slice.dataPoint.label;
        } else if (showPercentages) {
          labelText = `${slice.percentage.toFixed(1)}%`;
        }

        children.push({
          tag: 'text',
          props: {
            x: labelPos.x,
            y: labelPos.y,
            textAnchor: 'middle',
            fill: '#000',
            fontSize: 12,
          },
          children: [labelText],
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
        'aria-label': `Pie chart with ${this.receptiveField.data.length} slices`,
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
   * Get default color for slice index
   */
  private getDefaultColor(index: number): string {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
    ];

    return colors[index % colors.length] || '#000000';
  }

  /**
   * Process incoming signals
   */
  protected override async executeProcessing<TOutput = unknown>(_input: unknown): Promise<TOutput> {
    // Handle chart-specific signals here
    return undefined as TOutput;
  }
}
