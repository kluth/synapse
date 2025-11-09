/**
 * Tests for LineChart visualization component
 * Following TDD - tests first, implementation second
 */

import { LineChart } from '../LineChart';
import type { ChartDataPoint } from '../types';

describe('LineChart', () => {
  let chart: LineChart;

  const mockData: ChartDataPoint[] = [
    { x: 0, y: 10, label: 'Point 1' },
    { x: 1, y: 20, label: 'Point 2' },
    { x: 2, y: 15, label: 'Point 3' },
    { x: 3, y: 25, label: 'Point 4' },
    { x: 4, y: 30, label: 'Point 5' },
  ];

  beforeEach(() => {
    chart = new LineChart({
      id: 'test-line-chart',
      type: 'cortical',
      threshold: 0.5,
      props: {
        data: mockData,
        width: 800,
        height: 400,
        color: '#3b82f6',
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
    it('should create a line chart with data', () => {
      expect(chart.id).toBe('test-line-chart');
      expect(chart.getProps().data).toEqual(mockData);
      expect(chart.getProps().width).toBe(800);
      expect(chart.getProps().height).toBe(400);
    });

    it('should initialize with default state', () => {
      const state = chart.getState();
      expect(state.hoveredPoint).toBeNull();
      expect(state.selectedPoint).toBeNull();
    });

    it('should start in inactive status', () => {
      expect(chart.getStatus()).toBe('inactive');
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
      expect(bounds.minY).toBe(10);
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

    it('should handle single data point', () => {
      chart.updateProps({ data: [{ x: 5, y: 10 }] });
      const bounds = chart.getDataBounds();
      expect(bounds.minX).toBe(5);
      expect(bounds.maxX).toBe(5);
      expect(bounds.minY).toBe(10);
      expect(bounds.maxY).toBe(10);
    });

    it('should handle negative values', () => {
      chart.updateProps({
        data: [
          { x: -10, y: -5 },
          { x: 0, y: 0 },
          { x: 10, y: 5 },
        ],
      });
      const bounds = chart.getDataBounds();
      expect(bounds.minX).toBe(-10);
      expect(bounds.maxX).toBe(10);
      expect(bounds.minY).toBe(-5);
      expect(bounds.maxY).toBe(5);
    });
  });

  describe('Coordinate Transformation', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should convert data coordinates to canvas coordinates', () => {
      const canvasCoords = chart.dataToCanvas({ x: 0, y: 10 });
      expect(canvasCoords).toHaveProperty('x');
      expect(canvasCoords).toHaveProperty('y');
      expect(typeof canvasCoords.x).toBe('number');
      expect(typeof canvasCoords.y).toBe('number');
    });

    it('should convert canvas coordinates to data coordinates', () => {
      const dataCoords = chart.canvasToData({ x: 100, y: 100 });
      expect(dataCoords).toHaveProperty('x');
      expect(dataCoords).toHaveProperty('y');
      expect(typeof dataCoords.x).toBe('number');
      expect(typeof dataCoords.y).toBe('number');
    });

    it('should maintain coordinate transformation consistency', () => {
      const originalData = { x: 2, y: 15 };
      const canvasCoords = chart.dataToCanvas(originalData);
      const backToData = chart.canvasToData(canvasCoords);
      expect(backToData.x).toBeCloseTo(originalData.x, 1);
      expect(backToData.y).toBeCloseTo(originalData.y, 1);
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

    it('should include SVG path in render output', () => {
      const renderSignal = chart.render();
      expect(renderSignal.data.vdom).toBeDefined();
      expect(renderSignal.data.vdom.tag).toBe('svg');
    });

    it('should include chart dimensions in render output', () => {
      const renderSignal = chart.render();
      expect(renderSignal.data.vdom?.props?.['width']).toBe(800);
      expect(renderSignal.data.vdom?.props?.['height']).toBe(400);
    });

    it('should generate SVG path data for the line', () => {
      const pathData = chart.generatePathData();
      expect(typeof pathData).toBe('string');
      expect(pathData).toContain('M'); // SVG path should start with M (moveTo)
      expect(pathData).toContain('L'); // SVG path should contain L (lineTo)
    });

    it('should handle empty data without crashing', () => {
      chart.updateProps({ data: [] });
      const pathData = chart.generatePathData();
      expect(pathData).toBe('');
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

    it('should apply custom color to line', () => {
      chart.updateProps({ color: '#ff0000' });
      const renderSignal = chart.render();
      const pathElement = renderSignal.data.vdom?.children?.find(
        (child: unknown) => (child as { tag?: string }).tag === 'path',
      );
      expect((pathElement as unknown as { props: { stroke: string } }).props.stroke).toBe(
        '#ff0000',
      );
    });

    it('should support custom line width', () => {
      chart.updateProps({ lineWidth: 3 });
      const renderSignal = chart.render();
      const pathElement = renderSignal.data.vdom?.children?.find(
        (child: unknown) => (child as { tag?: string }).tag === 'path',
      ) as unknown as { props: { strokeWidth: number } };
      expect(pathElement.props.strokeWidth).toBe(3);
    });

    it('should support smooth curves', () => {
      chart.updateProps({ smooth: true });
      const pathData = chart.generatePathData();
      // Smooth curves use C (cubic bezier) instead of L (line)
      expect(pathData).toContain('C');
    });
  });

  describe('Interactivity', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should find nearest point to canvas coordinates', () => {
      const point = chart.findNearestPoint({ x: 100, y: 100 });
      expect(point).toBeDefined();
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');
    });

    it('should update state when hovering over point', async () => {
      const point = mockData[1]!;
      chart.onPointHover(point);
      const state = chart.getState();
      expect(state.hoveredPoint).toEqual(point);
    });

    it('should update state when clicking on point', async () => {
      const point = mockData[2]!;
      chart.onPointClick(point);
      const state = chart.getState();
      expect(state.selectedPoint).toEqual(point);
    });

    it('should emit UI event on point click', async () => {
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

    it('should not trigger re-render when props are identical', () => {
      const _spy = jest.spyOn(chart as unknown as { requestRender: () => void }, 'requestRender');
      const currentProps = chart.getProps();
      chart.updateProps(currentProps);
      expect(_spy).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should handle large datasets efficiently', () => {
      const largeData: ChartDataPoint[] = Array.from({ length: 1000 }, (_item, i) => ({
        x: i,
        y: Math.sin(i / 100) * 100,
      }));

      const startTime = performance.now();
      chart.updateProps({ data: largeData });
      const renderSignal = chart.render();
      const endTime = performance.now();

      // Should successfully render large dataset
      expect(renderSignal.type).toBe('render');
      expect(chart.getProps().data.length).toBe(1000);

      // Rendering should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should track render performance metrics', () => {
      chart.render();
      expect(chart.getLastRenderTime()).toBeGreaterThan(0);
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
  });
});
