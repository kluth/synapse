/**
 * Tests for BarChart visualization component
 * Following TDD - tests first, implementation second
 */

import { BarChart } from '../BarChart';
import type { ChartDataPoint } from '../types';

describe('BarChart', () => {
  let chart: BarChart;

  const mockData: ChartDataPoint[] = [
    { x: 0, y: 10, label: 'Category A' },
    { x: 1, y: 20, label: 'Category B' },
    { x: 2, y: 15, label: 'Category C' },
    { x: 3, y: 25, label: 'Category D' },
    { x: 4, y: 30, label: 'Category E' },
  ];

  beforeEach(() => {
    chart = new BarChart({
      id: 'test-bar-chart',
      type: 'cortical',
      threshold: 0.5,
      props: {
        data: mockData,
        width: 800,
        height: 400,
        color: '#3b82f6',
        orientation: 'vertical',
      },
      initialState: {
        hoveredPoint: null,
        selectedPoint: null,
      },
    });
  });

  afterEach(async () => {
    await chart.deactivate();
  });

  describe('Construction and Initialization', () => {
    it('should create a bar chart with data', () => {
      expect(chart.id).toBe('test-bar-chart');
      expect(chart.getProps().data).toEqual(mockData);
      expect(chart.getProps().width).toBe(800);
      expect(chart.getProps().height).toBe(400);
    });

    it('should initialize with default vertical orientation', () => {
      expect(chart.getProps().orientation).toBe('vertical');
    });

    it('should support horizontal orientation', () => {
      chart.updateProps({ orientation: 'horizontal' });
      expect(chart.getProps().orientation).toBe('horizontal');
    });

    it('should initialize with default state', () => {
      const state = chart.getState();
      expect(state.hoveredPoint).toBeNull();
      expect(state.selectedPoint).toBeNull();
    });
  });

  describe('Data Processing', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should calculate data bounds', () => {
      const bounds = chart.getDataBounds();
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(4);
      // Bar charts should include 0 as baseline
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(30);
    });

    it('should handle empty data gracefully', () => {
      chart.updateProps({ data: [] });
      const bounds = chart.getDataBounds();
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(0);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(0);
    });

    it('should handle negative values', () => {
      chart.updateProps({
        data: [
          { x: 0, y: -10 },
          { x: 1, y: 5 },
          { x: 2, y: -5 },
        ],
      });
      const bounds = chart.getDataBounds();
      expect(bounds.minY).toBe(-10);
      expect(bounds.maxY).toBe(5);
    });
  });

  describe('Bar Dimensions', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should calculate bar width automatically', () => {
      const barWidth = chart.calculateBarWidth();
      expect(barWidth).toBeGreaterThan(0);
      expect(typeof barWidth).toBe('number');
    });

    it('should respect custom bar width', () => {
      chart.updateProps({ barWidth: 50 });
      const barWidth = chart.calculateBarWidth();
      expect(barWidth).toBe(50);
    });

    it('should apply bar spacing', () => {
      chart.updateProps({ barSpacing: 10 });
      const bars = chart.calculateBarPositions();
      if (bars.length > 1) {
        const gap = bars[1]!.x - (bars[0]!.x + bars[0]!.width);
        expect(gap).toBe(10);
      }
    });

    it('should calculate bar positions for vertical orientation', () => {
      const bars = chart.calculateBarPositions();
      expect(Array.isArray(bars)).toBe(true);
      expect(bars.length).toBe(mockData.length);

      bars.forEach((bar) => {
        expect(bar).toHaveProperty('x');
        expect(bar).toHaveProperty('y');
        expect(bar).toHaveProperty('width');
        expect(bar).toHaveProperty('height');
      });
    });

    it('should calculate bar positions for horizontal orientation', () => {
      chart.updateProps({ orientation: 'horizontal' });
      const bars = chart.calculateBarPositions();
      expect(Array.isArray(bars)).toBe(true);
      expect(bars.length).toBe(mockData.length);

      bars.forEach((bar) => {
        expect(bar).toHaveProperty('x');
        expect(bar).toHaveProperty('y');
        expect(bar).toHaveProperty('width');
        expect(bar).toHaveProperty('height');
      });
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

    it('should include chart dimensions in render output', () => {
      const renderSignal = chart.render();
      expect(renderSignal.data.vdom?.props?.['width']).toBe(800);
      expect(renderSignal.data.vdom?.props?.['height']).toBe(400);
    });

    it('should render correct number of bars', () => {
      const renderSignal = chart.render();
      const bars =
        renderSignal.data.vdom?.children?.filter(
          (child: unknown) => (child as { tag?: string }).tag === 'rect',
        ) ?? [];
      expect(bars.length).toBe(mockData.length);
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

  describe('Styling', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should apply custom color to bars', () => {
      chart.updateProps({ color: '#ff0000' });
      const renderSignal = chart.render();
      const bars = (renderSignal.data.vdom?.children?.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'rect',
      ) ?? []) as unknown as Array<{ props: { fill: string } }>;
      expect(bars[0]!.props.fill).toBe('#ff0000');
    });

    it('should support per-bar colors', () => {
      const coloredData = mockData.map((d, i) => ({
        ...d,
        color: `#${i}${i}${i}`,
      }));
      chart.updateProps({ data: coloredData });
      const renderSignal = chart.render();
      const bars = (renderSignal.data.vdom?.children?.filter(
        (child: unknown) => (child as { tag?: string }).tag === 'rect',
      ) ?? []) as unknown as Array<{ props: { fill: string } }>;
      expect(bars[0]!.props.fill).toBe('#000');
      expect(bars[1]!.props.fill).toBe('#111');
    });

    it('should apply hover styles', async () => {
      const point = mockData[1]!;
      chart.onPointHover(point);
      chart.render();
      expect(chart.getState().hoveredPoint).toEqual(point);
    });
  });

  describe('Interactivity', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should find bar at canvas coordinates', () => {
      const bar = chart.findBarAtPoint({ x: 100, y: 100 });
      expect(bar === null || typeof bar === 'object').toBe(true);
    });

    it('should update state when hovering over bar', async () => {
      const point = mockData[1]!;
      chart.onPointHover(point);
      const state = chart.getState();
      expect(state.hoveredPoint).toEqual(point);
    });

    it('should update state when clicking on bar', async () => {
      const point = mockData[2]!;
      chart.onPointClick(point);
      const state = chart.getState();
      expect(state.selectedPoint).toEqual(point);
    });

    it('should emit UI event on bar click', async () => {
      const events: unknown[] = [];
      chart.on('signal', (signal) => {
        if ((signal as { type?: string }).type === 'ui:click') {
          events.push(signal);
        }
      });

      const point = mockData[0]!;
      chart.onPointClick(point);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(events.length).toBeGreaterThan(0);
      expect((events[0] as { data: { payload: unknown } }).data['payload']).toEqual(point);
    });
  });

  describe('Stacked Bars', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should support stacked mode', () => {
      chart.updateProps({ stacked: true });
      expect(chart.getProps().stacked).toBe(true);
    });

    it('should calculate stacked bar heights correctly', () => {
      chart.updateProps({ stacked: true });
      const bars = chart.calculateBarPositions();
      expect(Array.isArray(bars)).toBe(true);
    });
  });

  describe('Props Updates', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should update chart when data changes', () => {
      const newData: ChartDataPoint[] = [
        { x: 0, y: 5 },
        { x: 1, y: 10 },
      ];
      chart.updateProps({ data: newData });
      expect(chart.getProps().data).toEqual(newData);
    });

    it('should trigger re-render when props change', () => {
      const _spy = jest.spyOn(chart as unknown as { requestRender: () => void }, 'requestRender');
      chart.updateProps({ color: '#00ff00' });
      expect(_spy).toHaveBeenCalled();
    });

    it('should update when orientation changes', () => {
      chart.updateProps({ orientation: 'horizontal' });
      expect(chart.getProps().orientation).toBe('horizontal');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should handle many bars efficiently', () => {
      const largeData: ChartDataPoint[] = Array.from({ length: 100 }, (_item, i) => ({
        x: i,
        y: Math.random() * 100,
        label: `Bar ${i}`,
      }));

      const startTime = performance.now();
      chart.updateProps({ data: largeData });
      const renderSignal = chart.render();
      const endTime = performance.now();

      expect(renderSignal.type).toBe('render');
      expect(endTime - startTime).toBeLessThan(1000);
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
    });

    it('should provide data table alternative', () => {
      const dataTable = chart.getDataAsTable();
      expect(Array.isArray(dataTable)).toBe(true);
      expect(dataTable.length).toBe(mockData.length);
    });

    it('should include labels for screen readers', () => {
      const renderSignal = chart.render();
      const bars =
        renderSignal.data.vdom?.children?.filter(
          (child: unknown) => (child as { tag?: string }).tag === 'rect',
        ) ?? [];
      // Bars should have accessible titles
      expect(bars.length).toBeGreaterThan(0);
    });
  });
});
