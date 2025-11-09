/**
 * Synapse Framework E2E Demo App
 * This app demonstrates framework features for E2E testing
 */

import { VisualNeuron } from '../../src/ui/VisualNeuron';
import { LineChart, BarChart, PieChart, ScatterPlot } from '../../src/visualization';
import type { RenderSignal } from '../../src/ui/types';
import type { ChartDataPoint, PieDataPoint } from '../../src/visualization/types';

// Test VisualNeuron implementation
class TestNeuron extends VisualNeuron<{ label: string }, { count: number }> {
  protected override async executeProcessing<
    _TInput = unknown,
    TOutput = unknown,
  >(): Promise<TOutput> {
    return undefined as TOutput;
  }

  protected performRender(): RenderSignal {
    const { label } = this.receptiveField;
    const { count } = this.visualState;

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: {},
          children: [`${label}: ${count}`],
        },
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
}

// Global state
let currentNeuron: TestNeuron | null = null;
let currentChart: LineChart | BarChart | PieChart | ScatterPlot | null = null;

// Sample data
const lineData: ChartDataPoint[] = [
  { x: 0, y: 10, label: 'Jan' },
  { x: 1, y: 25, label: 'Feb' },
  { x: 2, y: 20, label: 'Mar' },
  { x: 3, y: 35, label: 'Apr' },
  { x: 4, y: 30, label: 'May' },
];

const barData: ChartDataPoint[] = [
  { x: 0, y: 30, label: 'Product A' },
  { x: 1, y: 45, label: 'Product B' },
  { x: 2, y: 25, label: 'Product C' },
  { x: 3, y: 55, label: 'Product D' },
];

const pieData: PieDataPoint[] = [
  { value: 30, label: 'Category A', color: '#3b82f6' },
  { value: 25, label: 'Category B', color: '#10b981' },
  { value: 20, label: 'Category C', color: '#f59e0b' },
  { value: 15, label: 'Category D', color: '#ef4444' },
  { value: 10, label: 'Category E', color: '#8b5cf6' },
];

const scatterData: ChartDataPoint[] = [
  { x: 10, y: 20, label: 'Point 1' },
  { x: 25, y: 35, label: 'Point 2' },
  { x: 40, y: 25, label: 'Point 3' },
  { x: 55, y: 45, label: 'Point 4' },
  { x: 70, y: 30, label: 'Point 5' },
];

// Lifecycle controls
const createBtn = document.getElementById('create-neuron') as HTMLButtonElement;
const activateBtn = document.getElementById('activate-neuron') as HTMLButtonElement;
const deactivateBtn = document.getElementById('deactivate-neuron') as HTMLButtonElement;
const statusSpan = document.getElementById('neuron-status') as HTMLSpanElement;
const renderCountSpan = document.getElementById('render-count') as HTMLSpanElement;

createBtn.addEventListener('click', () => {
  currentNeuron = new TestNeuron({
    id: 'test-neuron',
    type: 'cortical',
    threshold: 0.5,
    props: { label: 'Test' },
    initialState: { count: 0 },
  });

  activateBtn.disabled = false;
  createBtn.disabled = true;
  statusSpan.textContent = 'created';
  statusSpan.className = 'status inactive';
});

activateBtn.addEventListener('click', async () => {
  if (currentNeuron) {
    await currentNeuron.activate();
    
    // Trigger a render to increment count
    currentNeuron.render();
    
    statusSpan.textContent = 'active';
    statusSpan.className = 'status active';
    deactivateBtn.disabled = false;
    activateBtn.disabled = true;

    // Update render count
    renderCountSpan.textContent = currentNeuron.getRenderCount().toString();
  }
});

deactivateBtn.addEventListener('click', async () => {
  if (currentNeuron) {
    await currentNeuron.deactivate();
    statusSpan.textContent = 'inactive';
    statusSpan.className = 'status inactive';
    activateBtn.disabled = false;
    deactivateBtn.disabled = true;
  }
});

// Chart controls
const showLineBtn = document.getElementById('show-line-chart') as HTMLButtonElement;
const showBarBtn = document.getElementById('show-bar-chart') as HTMLButtonElement;
const showPieBtn = document.getElementById('show-pie-chart') as HTMLButtonElement;
const showScatterBtn = document.getElementById('show-scatter-plot') as HTMLButtonElement;
const chartContainer = document.getElementById('chart-container') as HTMLDivElement;
const chartInfo = document.getElementById('chart-info') as HTMLDivElement;

async function renderChart(chart: LineChart | BarChart | PieChart | ScatterPlot): Promise<void> {
  if (currentChart) {
    await currentChart.deactivate();
  }

  currentChart = chart;
  await chart.activate();

  const signal = chart.render();
  const svg = createSVGFromSignal(signal);

  chartContainer.innerHTML = '';
  chartContainer.appendChild(svg);

  chartInfo.innerHTML = `
    <div>Chart ID: <code>${chart.id}</code></div>
    <div>Render Count: <span id="chart-render-count">${chart.getRenderCount()}</span></div>
  `;
}

function createSVGFromSignal(signal: RenderSignal): SVGElement {
  const vdom = signal.data.vdom;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  // Set SVG attributes
  Object.entries(vdom.props ?? {}).forEach(([key, value]) => {
    svg.setAttribute(key, String(value));
  });

  // Add children
  if (vdom.children) {
    vdom.children.forEach((child) => {
      if (typeof child === 'string') {
        // Text node
        svg.appendChild(document.createTextNode(child));
      } else {
        // SVG element
        const element = createSVGElement(child);
        svg.appendChild(element);
      }
    });
  }

  return svg;
}

function createSVGElement(vdom: {
  tag: string;
  props?: Record<string, unknown>;
  children?: (string | { tag: string; props?: Record<string, unknown> })[];
}): SVGElement {
  const element = document.createElementNS('http://www.w3.org/2000/svg', vdom.tag);

  // Set attributes
  if (vdom.props) {
    Object.entries(vdom.props).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
  }

  // Add children
  if (vdom.children) {
    vdom.children.forEach(
      (child: string | { tag: string; props?: Record<string, unknown> }) => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(
            createSVGElement(
              child as {
                tag: string;
                props?: Record<string, unknown>;
                children?: (
                  | string
                  | { tag: string; props?: Record<string, unknown> }
                )[];
              },
            ),
          );
        }
      },
    );
  }

  return element;
}

showLineBtn.addEventListener('click', async () => {
  const chart = new LineChart({
    id: 'line-chart',
    type: 'cortical',
    threshold: 0.5,
    props: {
      data: lineData,
      width: 800,
      height: 300,
      color: '#3b82f6',
      smooth: true,
    },
    initialState: {
      hoveredPoint: null,
      selectedPoint: null,
    },
  });

  await renderChart(chart);
});

showBarBtn.addEventListener('click', async () => {
  const chart = new BarChart({
    id: 'bar-chart',
    type: 'cortical',
    threshold: 0.5,
    props: {
      data: barData,
      width: 800,
      height: 300,
      color: '#10b981',
      orientation: 'vertical',
    },
    initialState: {
      hoveredPoint: null,
      selectedPoint: null,
    },
  });

  await renderChart(chart);
});

showPieBtn.addEventListener('click', async () => {
  const chart = new PieChart({
    id: 'pie-chart',
    type: 'cortical',
    threshold: 0.5,
    props: {
      data: pieData,
      width: 400,
      height: 400,
      showLabels: true,
    },
    initialState: {
      hoveredSlice: null,
      selectedSlice: null,
    },
  });

  await renderChart(chart);
});

showScatterBtn.addEventListener('click', async () => {
  const chart = new ScatterPlot({
    id: 'scatter-plot',
    type: 'cortical',
    threshold: 0.5,
    props: {
      data: scatterData,
      width: 800,
      height: 300,
      color: '#f59e0b',
      pointShape: 'circle',
    },
    initialState: {
      hoveredPoint: null,
      selectedPoint: null,
    },
  });

  await renderChart(chart);
});

// Signal propagation demo
const createNetworkBtn = document.getElementById(
  'create-network',
) as HTMLButtonElement;
const sendSignalBtn = document.getElementById('send-signal') as HTMLButtonElement;
const signalLog = document.getElementById('signal-log') as HTMLDivElement;

createNetworkBtn.addEventListener('click', () => {
  signalLog.innerHTML = '<div>Neural network created (placeholder)</div>';
  sendSignalBtn.disabled = false;
  createNetworkBtn.disabled = true;
});

sendSignalBtn.addEventListener('click', () => {
  signalLog.innerHTML += '<div>Signal sent through network (placeholder)</div>';
});

// Make framework available globally for testing
(window as unknown as { Synapse: Record<string, unknown> }).Synapse = {
  get currentNeuron() {
    return currentNeuron;
  },
  get currentChart() {
    return currentChart;
  },
  VisualNeuron,
  LineChart,
  BarChart,
  PieChart,
  ScatterPlot,
};

console.log('Synapse Framework E2E Demo loaded');
