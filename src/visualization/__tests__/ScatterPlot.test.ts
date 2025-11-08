/**
 * Tests for ScatterPlot visualization component
 * Following TDD - tests first, implementation second
 */

import { ScatterPlot } from '../ScatterPlot';
import type { ChartDataPoint } from '../types';

describe('ScatterPlot', () => {
  let chart: ScatterPlot;

  const mockData: ChartDataPoint[] = [
    { x: 10, y: 20, label: 'Point 1' },
    { x: 25, y: 35, label: 'Point 2' },
    { x: 40, y: 25, label: 'Point 3' },
    { x: 55, y: 45, label: 'Point 4' },
    { x: 70, y: 30, label: 'Point 5' },
  ];

  beforeEach(() => {
    chart = new ScatterPlot({
      id: 'test-scatter-plot',
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
    it('should create a scatter plot with data', () => {
      expect(chart.id).toBe('test-scatter-plot');
      expect(chart.getProps().data).toEqual(mockData);
      expect(chart.getProps().width).toBe(800);
      expect(chart.getProps().height).toBe(400);
    });

    it('should initialize with default state', () => {
      const state = chart.getState();
      expect(state.hoveredPoint).toBeNull();
      expect(state.selectedPoint).toBeNull();
    });

    it('should support custom point radius', () => {
      chart.updateProps({ pointRadius: 8 });
      expect(chart.getProps().pointRadius).toBe(8);
    });

    it('should support different point shapes', () => {
      chart.updateProps({ pointShape: 'square' });
      expect(chart.getProps().pointShape).toBe('square');
    });
  });

  describe('Data Processing', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should calculate data bounds', () => {
      const bounds = chart.getDataBounds();
      expect(bounds.minX).toBe(10);
      expect(bounds.maxX).toBe(70);
      expect(bounds.minY).toBe(20);
      expect(bounds.maxY).toBe(45);
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
      const canvasCoords = chart.dataToCanvas({ x: 10, y: 20 });
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
      const originalData = { x: 40, y: 25 };
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

    it('should include SVG in render output', () => {
      const renderSignal = chart.render();
      expect(renderSignal.data.vdom).toBeDefined();
      expect(renderSignal.data.vdom.tag).toBe('svg');
    });

    it('should include chart dimensions in render output', () => {
      const renderSignal = chart.render();
      expect(renderSignal.data.vdom.props.width).toBe(800);
      expect(renderSignal.data.vdom.props.height).toBe(400);
    });

    it('should render correct number of points', () => {
      const renderSignal = chart.render();
      const points = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'circle' || child.tag === 'rect'
      );
      expect(points.length).toBe(mockData.length);
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

  describe('Point Shapes', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should render circles by default', () => {
      const renderSignal = chart.render();
      const circles = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'circle'
      );
      expect(circles.length).toBe(mockData.length);
    });

    it('should render squares when specified', () => {
      chart.updateProps({ pointShape: 'square' });
      const renderSignal = chart.render();
      const squares = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'rect'
      );
      expect(squares.length).toBe(mockData.length);
    });

    it('should render triangles when specified', () => {
      chart.updateProps({ pointShape: 'triangle' });
      const renderSignal = chart.render();
      const triangles = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'polygon'
      );
      expect(triangles.length).toBe(mockData.length);
    });

    it('should apply correct radius to circles', () => {
      chart.updateProps({ pointRadius: 10 });
      const renderSignal = chart.render();
      const circles = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'circle'
      );
      expect(circles[0].props.r).toBe(10);
    });
  });

  describe('Styling', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should apply custom color to points', () => {
      chart.updateProps({ color: '#ff0000' });
      const renderSignal = chart.render();
      const points = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'circle'
      );
      expect(points[0].props.fill).toBe('#ff0000');
    });

    it('should support per-point colors', () => {
      const coloredData = mockData.map((d, i) => ({
        ...d,
        color: i === 0 ? '#ff0000' : i === 1 ? '#00ff00' : undefined,
      }));
      chart.updateProps({ data: coloredData });
      const renderSignal = chart.render();
      const points = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'circle'
      );
      expect(points[0].props.fill).toBe('#ff0000');
      expect(points[1].props.fill).toBe('#00ff00');
    });

    it('should highlight hovered point', () => {
      chart.onPointHover(mockData[1]);
      const renderSignal = chart.render();
      expect(chart.getState().hoveredPoint).toEqual(mockData[1]);
    });

    it('should highlight selected point', () => {
      chart.onPointClick(mockData[2]);
      const renderSignal = chart.render();
      expect(chart.getState().selectedPoint).toEqual(mockData[2]);
    });
  });

  describe('Bubble Chart Mode', () => {
    const bubbleData: ChartDataPoint[] = [
      { x: 10, y: 20, label: 'Small', metadata: { size: 5 } },
      { x: 25, y: 35, label: 'Medium', metadata: { size: 15 } },
      { x: 40, y: 25, label: 'Large', metadata: { size: 25 } },
    ];

    beforeEach(async () => {
      chart.updateProps({ data: bubbleData, sizeField: 'size' });
      await chart.activate();
    });

    it('should support variable point sizes', () => {
      const size = chart.getPointSize(bubbleData[0]);
      expect(size).toBeDefined();
      expect(typeof size).toBe('number');
    });

    it('should scale point sizes correctly', () => {
      const smallSize = chart.getPointSize(bubbleData[0]);
      const largeSize = chart.getPointSize(bubbleData[2]);
      expect(largeSize).toBeGreaterThan(smallSize);
    });

    it('should render bubbles with different sizes', () => {
      const renderSignal = chart.render();
      const circles = renderSignal.data.vdom.children.filter(
        (child: any) => child.tag === 'circle'
      );

      const radii = circles.map((c: any) => c.props.r);
      expect(Math.max(...radii)).toBeGreaterThan(Math.min(...radii));
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

    it('should update state when hovering over point', () => {
      const point = mockData[1];
      chart.onPointHover(point);
      const state = chart.getState();
      expect(state.hoveredPoint).toEqual(point);
    });

    it('should update state when clicking on point', () => {
      const point = mockData[2];
      chart.onPointClick(point);
      const state = chart.getState();
      expect(state.selectedPoint).toEqual(point);
    });

    it('should emit UI event on point click', async () => {
      const events: any[] = [];
      chart.on('signal', (signal) => {
        if (signal.type === 'ui:click') {
          events.push(signal);
        }
      });

      const point = mockData[0];
      chart.onPointClick(point);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].data.payload).toEqual(point);
    });

    it('should clear hover state', () => {
      chart.onPointHover(mockData[0]);
      expect(chart.getState().hoveredPoint).toBeDefined();

      chart.onPointHover(null);
      expect(chart.getState().hoveredPoint).toBeNull();
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
      const spy = jest.spyOn(chart as any, 'requestRender');
      chart.updateProps({ color: '#00ff00' });
      expect(spy).toHaveBeenCalled();
    });

    it('should not trigger re-render when props are identical', () => {
      const spy = jest.spyOn(chart as any, 'requestRender');
      const currentProps = chart.getProps();
      chart.updateProps(currentProps);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should handle large datasets efficiently', () => {
      const largeData: ChartDataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));

      const startTime = performance.now();
      chart.updateProps({ data: largeData });
      const renderSignal = chart.render();
      const endTime = performance.now();

      expect(renderSignal.type).toBe('render');
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
      expect(renderSignal.data.vdom.props.role).toBe('img');
      expect(renderSignal.data.vdom.props['aria-label']).toBeDefined();
    });

    it('should provide data table alternative', () => {
      const dataTable = chart.getDataAsTable();
      expect(Array.isArray(dataTable)).toBe(true);
      expect(dataTable.length).toBe(mockData.length);
    });
  });

  describe('Clustering and Patterns', () => {
    beforeEach(async () => {
      await chart.activate();
    });

    it('should identify point clusters', () => {
      const clusteredData: ChartDataPoint[] = [
        { x: 10, y: 10 },
        { x: 11, y: 11 },
        { x: 12, y: 10 },
        { x: 50, y: 50 },
        { x: 51, y: 51 },
      ];

      chart.updateProps({ data: clusteredData });
      const clusters = chart.identifyClusters(5); // Distance threshold of 5

      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate point density', () => {
      const density = chart.calculateDensity({ x: 10, y: 20 }, 10);
      expect(typeof density).toBe('number');
      expect(density).toBeGreaterThanOrEqual(0);
    });
  });
});
