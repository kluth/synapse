/**
 * E2E BarChart Tests for Synapse Framework
 *
 * Tests for BarChart rendering, bars, orientation, and interactions.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: HIGH
 */

import { test, expect } from '@playwright/test';

test.describe('BarChart Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('VIS-BC-1: BarChart renders SVG element', async ({ page }) => {
    // GIVEN: A BarChart component with data
    // WHEN: The component is rendered in the browser
    await page.click('#show-bar-chart');

    // THEN: An SVG element with bars appears in the DOM
    const svg = page.locator('#chart-container svg');
    await expect(svg).toBeVisible();
  });

  test('VIS-BC-2: BarChart renders rectangle elements for bars', async ({ page }) => {
    // GIVEN: A BarChart with 4 data points
    // WHEN: The component renders
    await page.click('#show-bar-chart');

    // THEN: Rectangle elements are rendered
    const rects = page.locator('#chart-container svg rect');
    const count = await rects.count();
    expect(count).toBeGreaterThan(0);
  });

  test('VIS-BC-3: BarChart has correct dimensions', async ({ page }) => {
    // GIVEN: A BarChart with width=800 and height=300
    // WHEN: The component renders
    await page.click('#show-bar-chart');

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
    await page.click('#show-bar-chart');

    // THEN: Bars have the correct fill color
    const rect = page.locator('#chart-container svg rect').first();
    const fill = await rect.getAttribute('fill');
    expect(fill).toBe('#10b981');
  });

  test('VIS-BC-5: BarChart ID is correct', async ({ page }) => {
    // GIVEN: A BarChart component
    // WHEN: The chart is shown
    await page.click('#show-bar-chart');

    // THEN: The chart ID is 'bar-chart'
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('bar-chart');
  });

  test('VIS-BC-6: BarChart render count is displayed', async ({ page }) => {
    // GIVEN: A rendered BarChart
    // WHEN: The chart is shown
    await page.click('#show-bar-chart');

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
    await page.click('#show-bar-chart');
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
    await page.click('#show-bar-chart');

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
    await page.click('#show-bar-chart');

    // THEN: The SVG has a viewBox attribute
    const svg = page.locator('#chart-container svg');
    const viewBox = await svg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
  });

  test('VIS-BC-11: BarChart bars have non-zero height', async ({ page }) => {
    // GIVEN: A BarChart with positive data values
    // WHEN: The chart is rendered
    await page.click('#show-bar-chart');

    // THEN: Bars have height greater than 0
    const rect = page.locator('#chart-container svg rect').first();
    const height = await rect.getAttribute('height');
    expect(parseFloat(height || '0')).toBeGreaterThan(0);
  });

  test('VIS-BC-12: BarChart has accessibility role', async ({ page }) => {
    // GIVEN: A BarChart component
    // WHEN: The chart is rendered
    await page.click('#show-bar-chart');

    // THEN: The SVG has role="img" for accessibility
    const svg = page.locator('#chart-container svg');
    const role = await svg.getAttribute('role');
    expect(role).toBe('img');
  });

  test('VIS-BC-13: BarChart has aria-label', async ({ page }) => {
    // GIVEN: A BarChart component
    // WHEN: The chart is rendered
    await page.click('#show-bar-chart');

    // THEN: The SVG has an aria-label
    const svg = page.locator('#chart-container svg');
    const ariaLabel = await svg.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('VIS-BC-14: Switching from BarChart to another chart works', async ({ page }) => {
    // GIVEN: A rendered BarChart
    await page.click('#show-bar-chart');

    // WHEN: Switching to a PieChart
    await page.click('#show-pie-chart');

    // THEN: The chart container updates to show PieChart
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('pie-chart');
  });

  test('VIS-BC-15: BarChart container is cleared before rendering', async ({ page }) => {
    // GIVEN: A LineChart is already shown
    await page.click('#show-line-chart');

    // WHEN: Switching to BarChart
    await page.click('#show-bar-chart');

    // THEN: Only one SVG element is in the container
    const svgCount = await page.locator('#chart-container svg').count();
    expect(svgCount).toBe(1);
  });

  test('VIS-BC-16: BarChart bars are positioned correctly', async ({ page }) => {
    // GIVEN: A BarChart with data
    // WHEN: The chart is rendered
    await page.click('#show-bar-chart');

    // THEN: Bars have x and y coordinates
    const rect = page.locator('#chart-container svg rect').first();
    const x = await rect.getAttribute('x');
    const y = await rect.getAttribute('y');
    expect(x).toBeTruthy();
    expect(y).toBeTruthy();
  });

  test('VIS-BC-17: BarChart supports vertical orientation', async ({ page }) => {
    // GIVEN: A BarChart with orientation="vertical" (default)
    // WHEN: The chart is rendered
    await page.click('#show-bar-chart');

    // THEN: Bars grow upward from bottom (height > 0)
    const rect = page.locator('#chart-container svg rect').first();
    const height = await rect.getAttribute('height');
    expect(parseFloat(height || '0')).toBeGreaterThan(0);
  });

  test('VIS-BC-18: BarChart deactivates previous chart before rendering', async ({ page }) => {
    // GIVEN: A LineChart is active
    await page.click('#show-line-chart');
    const firstChartId = await page.locator('#chart-info code').textContent();

    // WHEN: BarChart is rendered
    await page.click('#show-bar-chart');

    // THEN: The chart ID changes, indicating previous chart was deactivated
    const secondChartId = await page.locator('#chart-info code').textContent();
    expect(secondChartId).not.toBe(firstChartId);
  });
});
