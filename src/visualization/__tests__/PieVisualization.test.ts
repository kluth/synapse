/**
 * Tests for PieVisualization component
 * Following TDD - tests first, implementation second
 */

import { PieVisualization } from '../PieVisualization';
import type { PieDataPoint } from '../types';

describe('PieVisualization', () => {
  let chart: PieVisualization;

  const mockData: PieDataPoint[] = [
    { value: 30, label: 'Category A', color: '#3b82f6' },
    { value: 20, label: 'Category B', color: '#10b981' },
    { value: 25, label: 'Category C', color: '#f59e0b' },
    { value: 15, label: 'Category D', color: '#ef4444' },
    { value: 10, label: 'Category E', color: '#8b5cf6' },
  ];

  beforeEach(() => {
    chart = new PieVisualization({
      id: 'test-pie-chart',
      type: 'cortical',
      threshold: 0.5,
      props: {
        data: mockData,
        width: 400,
        height: 400,
      },
      initialState: {
        hoveredSlice: null,
        selectedSlice: null,
      },
    });
  });

  afterEach(async () => {
    await chart.deactivate();
  });

  describe('Construction and Initialization', () => {
    it('should create a pie chart with data', () => {
      expect(chart.id).toBe('test-pie-chart');
      expect(chart.getProps().data).toEqual(mockData);
      expect(chart.getProps().width).toBe(400);
      expect(chart.getProps().height).toBe(400);
    });

    it('should initialize with default state', () => {
      const state = chart.getState();
      expect(state.hoveredSlice).toBeNull();
      expect(state.selectedSlice).toBeNull();
    });

    it('should support donut mode with inner radius', () => {
      chart.updateProps({ innerRadius: 50 });
      expect(chart.getProps().innerRadius).toBe(50);
    });
  });

  describe('Data Processing', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should calculate total value', () => {
      const total = chart.calculateTotal();
      expect(total).toBe(100); // Sum of all values
    });

    it('should calculate percentages for each slice', () => {
      const percentages = chart.calculatePercentages();
      expect(percentages.length).toBe(mockData.length);
      expect(percentages[0]).toBeCloseTo(30, 1);
      expect(percentages[1]).toBeCloseTo(20, 1);
      expect(percentages[2]).toBeCloseTo(25, 1);
    });

    it('should handle empty data gracefully', () => {
      chart.updateProps({ data: [] });
      const total = chart.calculateTotal();
      expect(total).toBe(0);
    });

    it('should handle single data point', () => {
      chart.updateProps({ data: [{ value: 100, label: 'Single' }] });
      const total = chart.calculateTotal();
      expect(total).toBe(100);
      const percentages = chart.calculatePercentages();
      expect(percentages[0]).toBe(100);
    });

    it('should handle zero values', () => {
      chart.updateProps({
        data: [
          { value: 50, label: 'A' },
          { value: 0, label: 'B' },
          { value: 50, label: 'C' },
        ],
      });
      const percentages = chart.calculatePercentages();
      expect(percentages[0]).toBe(50);
      expect(percentages[1]).toBe(0);
      expect(percentages[2]).toBe(50);
    });
  });

  describe('Angle Calculations', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should calculate start and end angles for each slice', () => {
      const slices = chart.calculateSliceAngles();
      expect(slices.length).toBe(mockData.length);

      // First slice should start at 0
      expect(slices[0]!.startAngle).toBeCloseTo(0, 2);

      // Angles should be in radians
      slices.forEach((slice) => {
        expect(slice.startAngle).toBeGreaterThanOrEqual(0);
        expect(slice.endAngle).toBeLessThanOrEqual(Math.PI * 2);
        expect(slice.endAngle).toBeGreaterThan(slice.startAngle);
      });
    });

    it('should calculate correct angle spans', () => {
      const slices = chart.calculateSliceAngles();
      const firstSliceSpan = slices[0]!.endAngle - slices[0]!.startAngle;

      // 30% of 360 degrees = 108 degrees = 1.885 radians
      expect(firstSliceSpan).toBeCloseTo((30 / 100) * Math.PI * 2, 2);
    });

    it('should have continuous angles (no gaps)', () => {
      const slices = chart.calculateSliceAngles();
      for (let i = 0; i < slices.length - 1; i++) {
        expect(slices[i]!.endAngle).toBeCloseTo(slices[i + 1]!.startAngle, 5);
      }
    });

    it('should complete full circle', () => {
      const slices = chart.calculateSliceAngles();
      const lastSlice = slices[slices.length - 1]!;
      expect(lastSlice.endAngle).toBeCloseTo(Math.PI * 2, 2);
    });
  });

  describe('SVG Path Generation', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should generate SVG path for pie slice', () => {
      const slices = chart.calculateSliceAngles();
      const path = chart.generateSlicePath(slices[0]!, 100, 0);

      expect(typeof path).toBe('string');
      expect(path).toContain('M'); // Move to center
      expect(path).toContain('L'); // Line to arc start
      expect(path).toContain('A'); // Arc command
      expect(path).toContain('Z'); // Close path
    });

    it('should generate donut slice path with inner radius', () => {
      chart.updateProps({ innerRadius: 50 });
      const slices = chart.calculateSliceAngles();
      const path = chart.generateSlicePath(slices[0]!, 100, 50);

      expect(path).toContain('M'); // Move to
      expect(path).toContain('A'); // Multiple arc commands for donut
    });

    it('should handle full circle slice', () => {
      chart.updateProps({ data: [{ value: 100, label: 'Full' }] });
      const slices = chart.calculateSliceAngles();
      const path = chart.generateSlicePath(slices[0]!, 100, 0);

      expect(path).toBeDefined();
      expect(typeof path).toBe('string');
    });
  });

  describe('Rendering', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should render a valid render signal', () => {
      const renderSignal = chart.render();
      expect(renderSignal.type).toBe('render');
      expect(renderSignal.data).toBeDefined();
      expect(renderSignal.strength).toBeGreaterThan(0);
    });

    it('should include SVG in render output', () => {
      const renderSignal = chart.render();
      expect(renderSignal.data.vdom).toBeDefined();
      expect(renderSignal.data.vdom.tag).toBe('svg');
    });

    it('should render correct number of slices', () => {
      const renderSignal = chart.render();
      const paths = renderSignal.data.vdom!.children!.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'path',
      );
      expect(paths.length).toBe(mockData.length);
    });

    it('should apply colors to slices', () => {
      const renderSignal = chart.render();
      const paths = renderSignal.data.vdom!.children!.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'path',
      ) as unknown as Array<{ props: { fill: string } }>;
      expect(paths[0]!.props.fill).toBe('#3b82f6');
      expect(paths[1]!.props.fill).toBe('#10b981');
    });

    it('should handle empty data without crashing', () => {
      chart.updateProps({ data: [] });
      const renderSignal = chart.render();
      expect(renderSignal.type).toBe('render');
    });

    it('should increment render count on each render', () => {
      const initialCount = chart.getRenderCount();
      chart.render();
      expect(chart.getRenderCount()).toBe(initialCount + 1);
    });
  });

  describe('Labels and Percentages', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should show labels when enabled', () => {
      chart.updateProps({ showLabels: true });
      const renderSignal = chart.render();
      const texts = renderSignal.data.vdom!.children!.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'text',
      );
      expect(texts.length).toBeGreaterThan(0);
    });

    it('should show percentages when enabled', () => {
      chart.updateProps({ showPercentages: true });
      const renderSignal = chart.render();
      const texts = renderSignal.data.vdom!.children!.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'text',
      );
      expect(texts.length).toBeGreaterThan(0);
    });

    it('should calculate label positions correctly', () => {
      const slices = chart.calculateSliceAngles();
      const labelPos = chart.calculateLabelPosition(slices[0]!, 100);

      expect(labelPos).toHaveProperty('x');
      expect(labelPos).toHaveProperty('y');
      expect(typeof labelPos.x).toBe('number');
      expect(typeof labelPos.y).toBe('number');
    });

    it('should not show labels when disabled', () => {
      chart.updateProps({ showLabels: false });
      const renderSignal = chart.render();
      const texts = renderSignal.data.vdom!.children!.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'text',
      );
      expect(texts.length).toBe(0);
    });
  });

  describe('Interactivity', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should find slice at angle', () => {
      const slice = chart.findSliceAtAngle(0.5); // Small angle, should be first slice
      expect(slice).toBeDefined();
      expect(slice?.label).toBe('Category A');
    });

    it('should update state when hovering over slice', () => {
      const slice = mockData[1]!;
      chart.onSliceHover(slice);
      const state = chart.getState();
      expect(state.hoveredSlice).toEqual(slice);
    });

    it('should update state when clicking on slice', () => {
      const slice = mockData[2]!;
      chart.onSliceClick(slice);
      const state = chart.getState();
      expect(state.selectedSlice).toEqual(slice);
    });

    it('should emit UI event on slice click', async () => {
      const events: unknown[] = [];
      chart.on('signal', (signal) => {
        if ((signal as { type?: string }).type === 'ui:click') {
          events.push(signal);
        }
      });

      const slice = mockData[0]!;
      chart.onSliceClick(slice);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(events.length).toBeGreaterThan(0);
      expect((events[0] as { data: { payload: unknown } }).data['payload']).toEqual(slice);
    });

    it('should highlight hovered slice', () => {
      chart.onSliceHover(mockData[1]!);
      chart.render();

      expect(chart.getState().hoveredSlice).toEqual(mockData[1]);
    });
  });

  describe('Donut Mode', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should render as donut with inner radius', () => {
      chart.updateProps({ innerRadius: 60 });
      const renderSignal = chart.render();

      expect(renderSignal.type).toBe('render');
      const paths = renderSignal.data.vdom!.children!.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'path',
      );
      expect(paths.length).toBe(mockData.length);
    });

    it('should calculate effective radius for donut', () => {
      chart.updateProps({ innerRadius: 50 });
      const radius = chart.calculateRadius();
      expect(radius).toBeGreaterThan(50);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should include ARIA labels', () => {
      const renderSignal = chart.render();
      expect(renderSignal.data.vdom?.props?.['role']).toBe('img');
      expect(renderSignal.data.vdom?.props?.['aria-label']).toBeDefined();
      expect(renderSignal.data.vdom?.props?.['aria-label']).toContain('Pie chart');
    });

    it('should provide data table alternative', () => {
      const dataTable = chart.getDataAsTable();
      expect(Array.isArray(dataTable)).toBe(true);
      expect(dataTable.length).toBe(mockData.length);
      expect(dataTable[0]).toHaveProperty('value');
      expect(dataTable[0]).toHaveProperty('label');
      expect(dataTable[0]).toHaveProperty('percentage');
    });
  });

  describe('Props Updates', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should update chart when data changes', () => {
      const newData: PieDataPoint[] = [
        { value: 60, label: 'New A' },
        { value: 40, label: 'New B' },
      ];
      chart.updateProps({ data: newData });
      expect(chart.getProps().data).toEqual(newData);
    });

    it('should trigger re-render when props change', () => {
      const spy = jest.spyOn(chart as unknown as { requestRender: () => void }, 'requestRender');
      chart.updateProps({ showLabels: true });
      expect(spy).toHaveBeenCalled();
    });

    it('should update when switching to donut mode', () => {
      chart.updateProps({ innerRadius: 50 });
      expect(chart.getProps().innerRadius).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should handle all negative values', () => {
      chart.updateProps({
        data: [
          { value: -10, label: 'A' },
          { value: -20, label: 'B' },
        ],
      });
      const total = chart.calculateTotal();
      expect(total).toBe(-30);
    });

    it('should handle very small values', () => {
      chart.updateProps({
        data: [
          { value: 0.001, label: 'Tiny A' },
          { value: 0.002, label: 'Tiny B' },
        ],
      });
      const percentages = chart.calculatePercentages();
      expect(percentages[0]).toBeCloseTo(33.33, 1);
    });

    it('should handle very large values', () => {
      chart.updateProps({
        data: [
          { value: 1000000, label: 'Large A' },
          { value: 2000000, label: 'Large B' },
        ],
      });
      const percentages = chart.calculatePercentages();
      expect(percentages[0]).toBeCloseTo(33.33, 1);
      expect(percentages[1]).toBeCloseTo(66.67, 1);
    });
  });
});
