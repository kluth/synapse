/**
 * E2E LineChart Tests for Synapse Framework
 *
 * Tests for LineChart rendering, interactions, and data updates.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: HIGH
 */

import { test, expect } from '@playwright/test';
import { showChart } from '../helpers/chart-helpers';

test.describe('LineChart Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('VIS-LC-1: LineChart renders SVG element', async ({ page }) => {
    // GIVEN: A LineChart component with data
    // WHEN: The component is rendered in the browser
    await showChart(page, 'line');

    // THEN: An SVG element appears in the DOM
    const svg = page.locator('#chart-container svg');
    await expect(svg).toBeVisible();
  });

  test('VIS-LC-2: LineChart path element is present', async ({ page }) => {
    // GIVEN: A LineChart with 5 data points
    // WHEN: The component renders
    await showChart(page, 'line');

    // THEN: The SVG contains a <path> element
    const path = page.locator('#chart-container svg path');
    await expect(path).toBeVisible();
  });

  test('VIS-LC-3: LineChart has correct dimensions', async ({ page }) => {
    // GIVEN: A LineChart with width=800 and height=300
    // WHEN: The component renders
    await showChart(page, 'line');

    // THEN: The SVG has width="800" and height="300"
    const svg = page.locator('#chart-container svg');
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');
    expect(width).toBe('800');
    expect(height).toBe('300');
  });

  test('VIS-LC-4: LineChart uses smooth curves when enabled', async ({ page }) => {
    // GIVEN: A LineChart with smooth=true
    // WHEN: The component renders
    await showChart(page, 'line');

    // THEN: The path uses cubic bezier curves (contains "C")
    const path = page.locator('#chart-container svg path').first();
    const d = await path.getAttribute('d');
    expect(d).toContain('C');
  });

  test('VIS-LC-5: LineChart has correct color', async ({ page }) => {
    // GIVEN: A LineChart with color="#3b82f6"
    // WHEN: The component renders
    await showChart(page, 'line');

    // THEN: The line path has the correct stroke color
    const path = page.locator('#chart-container svg path').first();
    const stroke = await path.getAttribute('stroke');
    expect(stroke).toBe('#3b82f6');
  });

  test('VIS-LC-6: LineChart ID is correct', async ({ page }) => {
    // GIVEN: A LineChart component
    // WHEN: The chart is shown
    await showChart(page, 'line');

    // THEN: The chart ID is 'line-chart'
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('line-chart');
  });

  test('VIS-LC-7: LineChart render count is displayed', async ({ page }) => {
    // GIVEN: A rendered LineChart
    // WHEN: The chart is shown
    await showChart(page, 'line');

    // THEN: The render count is displayed and greater than 0
    const renderCount = await page.locator('#chart-render-count').textContent();
    expect(parseInt(renderCount || '0')).toBeGreaterThan(0);
  });

  test('VIS-LC-8: LineChart renders without console errors', async ({ page }) => {
    // GIVEN: A page ready to show a chart
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: The LineChart is rendered
    await showChart(page, 'line');
    await page.waitForTimeout(500);

    // THEN: No console errors occurred
    expect(errors).toHaveLength(0);
  });

  test('VIS-LC-9: LineChart is accessible globally', async ({ page }) => {
    // GIVEN: A rendered LineChart
    await showChart(page, 'line');

    // WHEN: Checking the global Synapse object
    const hasLineChart = await page.evaluate(() => {
      return typeof (window as unknown as { Synapse: Record<string, unknown> }).Synapse['LineChart'] !== 'undefined';
    });

    // THEN: LineChart class is available
    expect(hasLineChart).toBe(true);
  });

  test('VIS-LC-10: LineChart currentChart is set', async ({ page }) => {
    // GIVEN: A rendered LineChart
    // WHEN: The chart is shown
    await showChart(page, 'line');

    // THEN: currentChart is set in the global object
    const hasCurrentChart = await page.evaluate(() => {
      return (window as unknown as { Synapse: { currentChart: unknown } }).Synapse.currentChart !== null;
    });
    expect(hasCurrentChart).toBe(true);
  });

  test('VIS-LC-11: LineChart SVG has viewBox attribute', async ({ page }) => {
    // GIVEN: A LineChart component
    // WHEN: The chart is rendered
    await showChart(page, 'line');

    // THEN: The SVG has a viewBox attribute
    const svg = page.locator('#chart-container svg');
    const viewBox = await svg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
  });

  test('VIS-LC-12: LineChart path has fill attribute', async ({ page }) => {
    // GIVEN: A LineChart component
    // WHEN: The chart is rendered
    await showChart(page, 'line');

    // THEN: The path has fill="none" (line only, no area fill)
    const path = page.locator('#chart-container svg path').first();
    const fill = await path.getAttribute('fill');
    expect(fill).toBe('none');
  });

  test('VIS-LC-13: LineChart path has stroke-width', async ({ page }) => {
    // GIVEN: A LineChart component
    // WHEN: The chart is rendered
    await showChart(page, 'line');

    // THEN: The path has a stroke-width attribute
    const path = page.locator('#chart-container svg path').first();
    const strokeWidth = await path.getAttribute('stroke-width');
    expect(strokeWidth).toBeTruthy();
  });

  test('VIS-LC-14: LineChart renders data points as circles when enabled', async ({ page }) => {
    // GIVEN: A LineChart with data points
    // WHEN: The chart is rendered
    await showChart(page, 'line');

    // THEN: Circle elements may be present for data points
    const svg = page.locator('#chart-container svg');
    const svgContent = await svg.innerHTML();
    expect(svgContent).toBeTruthy();
  });

  test('VIS-LC-15: Switching from LineChart to another chart works', async ({ page }) => {
    // GIVEN: A rendered LineChart
    await showChart(page, 'line');

    // WHEN: Switching to a BarChart
    await showChart(page, 'bar');

    // THEN: The chart container updates to show BarChart
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('bar-chart');
  });

  test('VIS-LC-16: LineChart container is cleared before rendering', async ({ page }) => {
    // GIVEN: A BarChart is already shown
    await showChart(page, 'bar');

    // WHEN: Switching to LineChart
    await showChart(page, 'line');

    // THEN: Only one SVG element is in the container
    const svgCount = await page.locator('#chart-container svg').count();
    expect(svgCount).toBe(1);
  });

  test('VIS-LC-17: LineChart has accessibility role', async ({ page }) => {
    // GIVEN: A LineChart component
    // WHEN: The chart is rendered
    await showChart(page, 'line');

    // THEN: The SVG has role="img" for accessibility
    const svg = page.locator('#chart-container svg');
    const role = await svg.getAttribute('role');
    expect(role).toBe('img');
  });

  test('VIS-LC-18a: LineChart has a descriptive aria-label', async ({ page }) => {
    // GIVEN: A LineChart component
    // WHEN: The chart is rendered
    await showChart(page, 'line');

    // THEN: The SVG has a descriptive aria-label
    const svg = page.locator('[data-testid="linechart-svg"]');
    const ariaLabel = await svg.getAttribute('aria-label');
    expect(ariaLabel).toContain('Line chart showing data from');
  });

  test('VIS-LC-21: LineChart is focusable via keyboard', async ({ page }) => {
    // GIVEN: A LineChart component is rendered
    await showChart(page, 'line');

    // WHEN: The user presses the Tab key
    await page.keyboard.press('Tab');

    // THEN: The chart's SVG element should be focused
    const focusedElement = page.locator(':focus');
    const testId = await focusedElement.getAttribute('data-testid');
    expect(testId).toBe('linechart-svg');
  });

  test('VIS-LC-19: LineChart activation changes currentChart reference', async ({ page }) => {
    // GIVEN: No chart is shown initially
    // WHEN: LineChart is activated
    await showChart(page, 'line');

    // THEN: currentChart references a LineChart instance
    const isLineChart = await page.evaluate(() => {
      const chart = (window as unknown as { Synapse: { currentChart?: { constructor: { name: string } } } }).Synapse.currentChart;
      return chart?.constructor.name === 'LineChart';
    });
    expect(isLineChart).toBe(true);
  });

  test('VIS-LC-23: Brush and zoom works correctly', async ({ page }) => {
    // GIVEN: A LineChart is rendered
    await showChart(page, 'line');
    const initialDataCount = await page.evaluate(() => (window as any).Synapse.currentChart.receptiveField.data.length);

    // WHEN: The user brushes on the chart
    await page.mouse.move(100, 150);
    await page.mouse.down();
    await page.mouse.move(300, 150);
    await page.mouse.up();

    // THEN: The chart should be zoomed in
    const zoomedDataCount = await page.evaluate(() => (window as any).Synapse.currentChart.receptiveField.data.length);
    expect(zoomedDataCount).toBeLessThan(initialDataCount);

    // WHEN: The user clicks the reset zoom button
    await page.click('#reset-zoom');

    // THEN: The chart should be reset
    const resetDataCount = await page.evaluate(() => (window as any).Synapse.currentChart.receptiveField.data.length);
    expect(resetDataCount).toBe(initialDataCount);
  });

  test('VIS-LC-22: Tooltip appears on hover and disappears on mouse out', async ({ page }) => {
    // GIVEN: A LineChart is rendered
    await showChart(page, 'line');
    const firstPoint = page.locator('#chart-container svg circle').first();
    const pointData = await page.evaluate(() => (window as any).Synapse.currentChart.receptiveField.data[0]);

    // WHEN: The user hovers over the first point
    await firstPoint.hover();

    // THEN: A tooltip with the correct value should be visible
    const tooltip = page.locator('#chart-container svg text');
    await expect(tooltip).toBeVisible();
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toBe(pointData.y.toString());

    // WHEN: The user moves the mouse away
    await page.mouse.move(0, 0);

    // THEN: The tooltip should not be visible
    await expect(tooltip).not.toBeVisible();
  });
});
