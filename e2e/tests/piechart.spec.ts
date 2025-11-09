/**
 * E2E PieChart Tests for Synapse Framework
 *
 * Tests for PieChart rendering, slices, percentages, and interactions.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: MEDIUM
 */

import { test, expect } from '@playwright/test';

test.describe('PieChart Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('VIS-PC-1: PieChart renders SVG element', async ({ page }) => {
    // GIVEN: A PieChart component with data
    // WHEN: The component is rendered
    await page.click('#show-pie-chart');

    // THEN: An SVG element with slices appears
    const svg = page.locator('#chart-container svg');
    await expect(svg).toBeVisible();
  });

  test('VIS-PC-2: PieChart renders path elements for slices', async ({ page }) => {
    // GIVEN: A PieChart with 5 data points
    // WHEN: The component renders
    await page.click('#show-pie-chart');

    // THEN: Path elements for slices are rendered
    const paths = page.locator('#chart-container svg path');
    const count = await paths.count();
    expect(count).toBeGreaterThan(0);
  });

  test('VIS-PC-3: PieChart has correct dimensions', async ({ page }) => {
    // GIVEN: A PieChart with width=400 and height=400
    // WHEN: The component renders
    await page.click('#show-pie-chart');

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
    await page.click('#show-pie-chart');

    // THEN: The chart ID is 'pie-chart'
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('pie-chart');
  });

  test('VIS-PC-5: PieChart render count is displayed', async ({ page }) => {
    // GIVEN: A rendered PieChart
    // WHEN: The chart is shown
    await page.click('#show-pie-chart');

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
    await page.click('#show-pie-chart');
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
    await page.click('#show-pie-chart');

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
    await page.click('#show-pie-chart');

    // THEN: The SVG has a viewBox attribute
    const svg = page.locator('#chart-container svg');
    const viewBox = await svg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
  });

  test('VIS-PC-10: PieChart slices have fill colors', async ({ page }) => {
    // GIVEN: A PieChart with colored data points
    // WHEN: The chart is rendered
    await page.click('#show-pie-chart');

    // THEN: Slices have fill attributes
    const path = page.locator('#chart-container svg path').first();
    const fill = await path.getAttribute('fill');
    expect(fill).toBeTruthy();
  });

  test('VIS-PC-11: PieChart has accessibility role', async ({ page }) => {
    // GIVEN: A PieChart component
    // WHEN: The chart is rendered
    await page.click('#show-pie-chart');

    // THEN: The SVG has role="img" for accessibility
    const svg = page.locator('#chart-container svg');
    const role = await svg.getAttribute('role');
    expect(role).toBe('img');
  });

  test('VIS-PC-12: PieChart has aria-label', async ({ page }) => {
    // GIVEN: A PieChart component
    // WHEN: The chart is rendered
    await page.click('#show-pie-chart');

    // THEN: The SVG has an aria-label
    const svg = page.locator('#chart-container svg');
    const ariaLabel = await svg.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('VIS-PC-13: PieChart shows labels when enabled', async ({ page }) => {
    // GIVEN: A PieChart with showLabels=true
    // WHEN: The chart is rendered
    await page.click('#show-pie-chart');

    // THEN: Text elements for labels are present
    const texts = page.locator('#chart-container svg text');
    const count = await texts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('VIS-PC-14: Switching from PieChart to another chart works', async ({ page }) => {
    // GIVEN: A rendered PieChart
    await page.click('#show-pie-chart');

    // WHEN: Switching to a ScatterPlot
    await page.click('#show-scatter-plot');

    // THEN: The chart container updates to show ScatterPlot
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('scatter-plot');
  });

  test('VIS-PC-15: PieChart container is cleared before rendering', async ({ page }) => {
    // GIVEN: A BarChart is already shown
    await page.click('#show-bar-chart');

    // WHEN: Switching to PieChart
    await page.click('#show-pie-chart');

    // THEN: Only one SVG element is in the container
    const svgCount = await page.locator('#chart-container svg').count();
    expect(svgCount).toBe(1);
  });
});
