/**
 * E2E PieChart Tests for Synapse Framework
 *
 * Tests for PieChart rendering, slices, percentages, and interactions.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: MEDIUM
 */

import { test, expect } from '@playwright/test';
import { showChart } from '../helpers/chart-helpers';

test.describe('PieChart Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('VIS-PC-1: PieChart renders SVG element', async ({ page }) => {
    // GIVEN: A PieChart component with data
    // WHEN: The component is rendered
    await showChart(page, 'pie');

    // THEN: An SVG element with slices appears
    const svg = page.locator('#chart-container svg');
    await expect(svg).toBeVisible();
  });

  test('VIS-PC-2: PieChart renders path elements for slices', async ({ page }) => {
    // GIVEN: A PieChart with 5 data points
    // WHEN: The component renders
    await showChart(page, 'pie');

    // THEN: Path elements for slices are rendered
    const paths = page.locator('#chart-container svg path');
    const count = await paths.count();
    expect(count).toBeGreaterThan(0);
  });

  test('VIS-PC-3: PieChart has correct dimensions', async ({ page }) => {
    // GIVEN: A PieChart with width=400 and height=400
    // WHEN: The component renders
    await showChart(page, 'pie');

    // THEN: The SVG has correct dimensions
    const svg = page.locator('#chart-container svg');
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');
    expect(width).toBe('400');
    expect(height).toBe('400');
  });

  test('VIS-PC-4: PieChart ID is correct', async ({ page }) => {
    // GIVEN: A PieChart component
    // WHEN: The chart is shown
    await showChart(page, 'pie');

    // THEN: The chart ID is 'pie-chart'
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('pie-chart');
  });

  test('VIS-PC-5: PieChart render count is displayed', async ({ page }) => {
    // GIVEN: A rendered PieChart
    // WHEN: The chart is shown
    await showChart(page, 'pie');

    // THEN: The render count is displayed and greater than 0
    const renderCount = await page.locator('#chart-render-count').textContent();
    expect(parseInt(renderCount || '0')).toBeGreaterThan(0);
  });

  test('VIS-PC-6: PieChart renders without console errors', async ({ page }) => {
    // GIVEN: A page ready to show a chart
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: The PieChart is rendered
    await showChart(page, 'pie');
    await page.waitForTimeout(500);

    // THEN: No console errors occurred
    expect(errors).toHaveLength(0);
  });

  test('VIS-PC-7: PieChart is accessible globally', async ({ page }) => {
    // GIVEN: The framework is loaded
    // WHEN: Checking the global Synapse object
    const hasPieChart = await page.evaluate(() => {
      return typeof (window as unknown as { Synapse: Record<string, unknown> }).Synapse['PieChart'] !== 'undefined';
    });

    // THEN: PieChart class is available
    expect(hasPieChart).toBe(true);
  });

  test('VIS-PC-8: PieChart currentChart is set', async ({ page }) => {
    // GIVEN: A rendered PieChart
    // WHEN: The chart is shown
    await showChart(page, 'pie');

    // THEN: currentChart is set to a PieChart instance
    const isPieChart = await page.evaluate(() => {
      const chart = (window as unknown as { Synapse: { currentChart?: { constructor: { name: string } } } }).Synapse.currentChart;
      return chart?.constructor.name === 'PieChart';
    });
    expect(isPieChart).toBe(true);
  });

  test('VIS-PC-9: PieChart SVG has viewBox attribute', async ({ page }) => {
    // GIVEN: A PieChart component
    // WHEN: The chart is rendered
    await showChart(page, 'pie');

    // THEN: The SVG has a viewBox attribute
    const svg = page.locator('#chart-container svg');
    const viewBox = await svg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
  });

  test('VIS-PC-10: PieChart slices have fill colors', async ({ page }) => {
    // GIVEN: A PieChart with colored data points
    // WHEN: The chart is rendered
    await showChart(page, 'pie');

    // THEN: Slices have fill attributes
    const path = page.locator('#chart-container svg path').first();
    const fill = await path.getAttribute('fill');
    expect(fill).toBeTruthy();
  });

  test('VIS-PC-11: PieChart has accessibility role', async ({ page }) => {
    // GIVEN: A PieChart component
    // WHEN: The chart is rendered
    await showChart(page, 'pie');

    // THEN: The SVG has role="img" for accessibility
    const svg = page.locator('#chart-container svg');
    const role = await svg.getAttribute('role');
    expect(role).toBe('img');
  });

  test('VIS-PC-12a: PieChart has a descriptive aria-label', async ({ page }) => {
    // GIVEN: A PieChart component
    // WHEN: The chart is rendered
    await showChart(page, 'pie');

    // THEN: The SVG has a descriptive aria-label
    const svg = page.locator('[data-testid="piechart-svg"]');
    const ariaLabel = await svg.getAttribute('aria-label');
    expect(ariaLabel).toContain('Pie chart showing data for');
  });

  test('VIS-PC-16: PieChart is focusable via keyboard', async ({ page }) => {
    // GIVEN: A PieChart component is rendered
    await showChart(page, 'pie');

    // WHEN: The user presses the Tab key
    await page.keyboard.press('Tab');

    // THEN: The chart's SVG element should be focused
    const focusedElement = page.locator(':focus');
    const testId = await focusedElement.getAttribute('data-testid');
    expect(testId).toBe('piechart-svg');
  });

  test('VIS-PC-13: PieChart shows labels when enabled', async ({ page }) => {
    // GIVEN: A PieChart with showLabels=true
    // WHEN: The chart is rendered
    await showChart(page, 'pie');

    // THEN: Text elements for labels are present
    const texts = page.locator('#chart-container svg text');
    const count = await texts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('VIS-PC-14: Switching from PieChart to another chart works', async ({ page }) => {
    // GIVEN: A rendered PieChart
    await showChart(page, 'pie');

    // WHEN: Switching to a ScatterPlot
    await showChart(page, 'scatter');

    // THEN: The chart container updates to show ScatterPlot
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('scatter-plot');
  });

  test('VIS-PC-17: Tooltip appears on hover and disappears on mouse out', async ({ page }) => {
    // GIVEN: A PieChart is rendered
    await showChart(page, 'pie');
    const firstSlice = page.locator('#chart-container svg path').first();
    const sliceData = await page.evaluate(() => (window as any).Synapse.currentChart.receptiveField.data[0]);

    // WHEN: The user hovers over the first slice
    await firstSlice.hover();

    // THEN: A tooltip with the correct value should be visible
    const tooltip = page.locator('#chart-container svg text').last();
    await expect(tooltip).toBeVisible();
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toBe(`${sliceData.label}: ${sliceData.value}`);

    // WHEN: The user moves the mouse away
    await page.mouse.move(0, 0);

    // THEN: The tooltip should not be visible
    await expect(tooltip).not.toBeVisible();
  });

  test('VIS-PC-19: Clicking a slice filters the bar chart', async ({ page }) => {
    // GIVEN: A PieChart and a BarChart are rendered
    await showChart(page, 'pie');

    // WHEN: The user clicks on the first slice
    const firstSlice = page.locator('#chart-container svg path').first();
    await firstSlice.click();

    // THEN: The BarChart should be rendered with one bar
    const rects = page.locator('#chart-container svg rect');
    const count = await rects.count();
    expect(count).toBe(1);
  });

  test('VIS-PC-18: PieChart slices have separation', async ({ page }) => {
    // GIVEN: A PieChart is rendered
    await showChart(page, 'pie');
    const firstSlice = page.locator('#chart-container svg path').first();

    // WHEN: The chart is rendered
    const strokeWidth = await firstSlice.getAttribute('stroke-width');

    // THEN: The slice has a stroke-width greater than 0
    expect(parseFloat(strokeWidth || '0')).toBeGreaterThan(0);
  });
});
