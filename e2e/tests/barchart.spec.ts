/**
 * E2E BarChart Tests for Synapse Framework
 *
 * Tests for BarChart rendering, bars, orientation, and interactions.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: HIGH
 */

import { test, expect } from '@playwright/test';
import { showChart } from '../helpers/chart-helpers';

test.describe('BarChart Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('VIS-BC-1: BarChart renders SVG element', async ({ page }) => {
    // GIVEN: A BarChart component with data
    // WHEN: The component is rendered in the browser
    await showChart(page, 'bar');

    // THEN: An SVG element with bars appears in the DOM
    const svg = page.locator('#chart-container svg');
    await expect(svg).toBeVisible();
  });

  test('VIS-BC-2: BarChart renders rectangle elements for bars', async ({ page }) => {
    // GIVEN: A BarChart with 4 data points
    // WHEN: The component renders
    await showChart(page, 'bar');

    // THEN: Rectangle elements are rendered
    const rects = page.locator('#chart-container svg rect');
    const count = await rects.count();
    expect(count).toBeGreaterThan(0);
  });

  test('VIS-BC-3: BarChart has correct dimensions', async ({ page }) => {
    // GIVEN: A BarChart with width=800 and height=300
    // WHEN: The component renders
    await showChart(page, 'bar');

    // THEN: The SVG has correct dimensions
    const svg = page.locator('#chart-container svg');
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');
    expect(width).toBe('800');
    expect(height).toBe('300');
  });

  test('VIS-BC-4: BarChart uses correct color', async ({ page }) => {
    // GIVEN: A BarChart with color="#10b981"
    // WHEN: The component renders
    await showChart(page, 'bar');

    // THEN: Bars have the correct fill color
    const rect = page.locator('#chart-container svg rect').first();
    const fill = await rect.getAttribute('fill');
    expect(fill).toBe('#10b981');
  });

  test('VIS-BC-5: BarChart ID is correct', async ({ page }) => {
    // GIVEN: A BarChart component
    // WHEN: The chart is shown
    await showChart(page, 'bar');

    // THEN: The chart ID is 'bar-chart'
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('bar-chart');
  });

  test('VIS-BC-6: BarChart render count is displayed', async ({ page }) => {
    // GIVEN: A rendered BarChart
    // WHEN: The chart is shown
    await showChart(page, 'bar');

    // THEN: The render count is displayed and greater than 0
    const renderCount = await page.locator('#chart-render-count').textContent();
    expect(parseInt(renderCount || '0')).toBeGreaterThan(0);
  });

  test('VIS-BC-7: BarChart renders without console errors', async ({ page }) => {
    // GIVEN: A page ready to show a chart
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: The BarChart is rendered
    await showChart(page, 'bar');
    await page.waitForTimeout(500);

    // THEN: No console errors occurred
    expect(errors).toHaveLength(0);
  });

  test('VIS-BC-8: BarChart is accessible globally', async ({ page }) => {
    // GIVEN: The framework is loaded
    // WHEN: Checking the global Synapse object
    const hasBarChart = await page.evaluate(() => {
      return typeof (window as unknown as { Synapse: Record<string, unknown> }).Synapse['BarChart'] !== 'undefined';
    });

    // THEN: BarChart class is available
    expect(hasBarChart).toBe(true);
  });

  test('VIS-BC-9: BarChart currentChart is set', async ({ page }) => {
    // GIVEN: A rendered BarChart
    // WHEN: The chart is shown
    await showChart(page, 'bar');

    // THEN: currentChart is set to a BarChart instance
    const isBarChart = await page.evaluate(() => {
      const chart = (window as unknown as { Synapse: { currentChart?: { constructor: { name: string } } } }).Synapse.currentChart;
      return chart?.constructor.name === 'BarChart';
    });
    expect(isBarChart).toBe(true);
  });

  test('VIS-BC-10: BarChart SVG has viewBox attribute', async ({ page }) => {
    // GIVEN: A BarChart component
    // WHEN: The chart is rendered
    await showChart(page, 'bar');

    // THEN: The SVG has a viewBox attribute
    const svg = page.locator('#chart-container svg');
    const viewBox = await svg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
  });

  test('VIS-BC-11: BarChart bars have non-zero height', async ({ page }) => {
    // GIVEN: A BarChart with positive data values
    // WHEN: The chart is rendered
    await showChart(page, 'bar');

    // THEN: Bars have height greater than 0
    const rect = page.locator('#chart-container svg rect').first();
    const height = await rect.getAttribute('height');
    expect(parseFloat(height || '0')).toBeGreaterThan(0);
  });

  test('VIS-BC-12: BarChart has accessibility role', async ({ page }) => {
    // GIVEN: A BarChart component
    // WHEN: The chart is rendered
    await showChart(page, 'bar');

    // THEN: The SVG has role="img" for accessibility
    const svg = page.locator('#chart-container svg');
    const role = await svg.getAttribute('role');
    expect(role).toBe('img');
  });

  test('VIS-BC-13a: BarChart has a descriptive aria-label', async ({ page }) => {
    // GIVEN: A BarChart component
    // WHEN: The chart is rendered
    await showChart(page, 'bar');

    // THEN: The SVG has a descriptive aria-label
    const svg = page.locator('[data-testid="barchart-svg"]');
    const ariaLabel = await svg.getAttribute('aria-label');
    expect(ariaLabel).toContain('Bar chart showing');
  });

  test('VIS-BC-19: BarChart is focusable via keyboard', async ({ page }) => {
    // GIVEN: A BarChart component is rendered
    await showChart(page, 'bar');

    // WHEN: The user presses the Tab key
    await page.keyboard.press('Tab');

    // THEN: The chart's SVG element should be focused
    const focusedElement = page.locator(':focus');
    const testId = await focusedElement.getAttribute('data-testid');
    expect(testId).toBe('barchart-svg');
  });

  test('VIS-BC-14: Switching from BarChart to another chart works', async ({ page }) => {
    // GIVEN: A rendered BarChart
    await showChart(page, 'bar');

    // WHEN: Switching to a PieChart
    await showChart(page, 'pie');

    // THEN: The chart container updates to show PieChart
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('pie-chart');
  });

  test('VIS-BC-15: BarChart container is cleared before rendering', async ({ page }) => {
    // GIVEN: A LineChart is already shown
    await showChart(page, 'line');

    // WHEN: Switching to BarChart
    await showChart(page, 'bar');

    // THEN: Only one SVG element is in the container
    const svgCount = await page.locator('#chart-container svg').count();
    expect(svgCount).toBe(1);
  });

  test('VIS-BC-16: BarChart bars are positioned correctly', async ({ page }) => {
    // GIVEN: A BarChart with data
    // WHEN: The chart is rendered
    await showChart(page, 'bar');

    // THEN: Bars have x and y coordinates
    const rect = page.locator('#chart-container svg rect').first();
    const x = await rect.getAttribute('x');
    const y = await rect.getAttribute('y');
    expect(x).toBeTruthy();
    expect(y).toBeTruthy();
  });

  test('VIS-BC-21: Tooltip appears on hover and disappears on mouse out', async ({ page }) => {
    // GIVEN: A BarChart is rendered
    await showChart(page, 'bar');
    const firstBar = page.locator('#chart-container svg rect').first();
    const barData = await page.evaluate(() => (window as any).Synapse.currentChart.receptiveField.data[0]);

    // WHEN: The user hovers over the first bar
    await firstBar.hover();

    // THEN: A tooltip with the correct value should be visible
    const tooltip = page.locator('#chart-container svg text');
    await expect(tooltip).toBeVisible();
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toBe(barData.y.toString());

    // WHEN: The user moves the mouse away
    await page.mouse.move(0, 0);

    // THEN: The tooltip should not be visible
    await expect(tooltip).not.toBeVisible();
  });

  test('VIS-BC-23: Legend is rendered correctly', async ({ page }) => {
    // GIVEN: A BarChart with a legend
    await showChart(page, 'bar');

    // WHEN: The chart is rendered
    const legend = page.locator('#chart-container svg g');
    await expect(legend).toBeVisible();

    // THEN: The legend has the correct number of items
    const legendItems = legend.locator('text');
    const count = await legendItems.count();
    expect(count).toBe(4);
  });

  test('VIS-BC-22: BarChart animates on render', async ({ page }) => {
    // GIVEN: A BarChart with animation enabled
    await showChart(page, 'bar');

    // WHEN: The chart is rendered
    const firstBar = page.locator('#chart-container svg rect').first();
    const initialHeight = await firstBar.getAttribute('height');
    expect(initialHeight).toBe('0');

    // THEN: The bars should animate to their final height
    await page.waitForTimeout(1000);
    const finalHeight = await firstBar.getAttribute('height');
    expect(parseFloat(finalHeight || '0')).toBeGreaterThan(0);
  });

  test('VIS-BC-20: BarChart bars have minimum separation', async ({ page }) => {
    // GIVEN: A BarChart with multiple data points
    await showChart(page, 'bar');

    // WHEN: The chart is rendered
    const rects = page.locator('#chart-container svg rect');
    const firstBar = rects.nth(0);
    const secondBar = rects.nth(1);

    const firstBarX = await firstBar.getAttribute('x');
    const secondBarX = await secondBar.getAttribute('x');

    // THEN: The bars are separated by a certain distance
    const separation = parseFloat(secondBarX || '0') - parseFloat(firstBarX || '0');
    expect(separation).toBeGreaterThan(0);
  });
});
