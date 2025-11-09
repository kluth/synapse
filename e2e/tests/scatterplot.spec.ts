/**
 * E2E ScatterPlot Tests for Synapse Framework
 *
 * Tests for ScatterPlot rendering, points, shapes, and interactions.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: MEDIUM
 */

import { test, expect } from '@playwright/test';

test.describe('ScatterPlot Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('VIS-SP-1: ScatterPlot renders SVG element', async ({ page }) => {
    // GIVEN: A ScatterPlot with data
    // WHEN: The component is rendered
    await page.click('#show-scatter-plot');

    // THEN: An SVG with point shapes appears
    const svg = page.locator('#chart-container svg');
    await expect(svg).toBeVisible();
  });

  test('VIS-SP-2: ScatterPlot renders shape elements for points', async ({ page }) => {
    // GIVEN: A ScatterPlot with pointShape="circle"
    // WHEN: The component renders
    await page.click('#show-scatter-plot');

    // THEN: Circle or other shape elements are rendered
    const svg = page.locator('#chart-container svg');
    const svgContent = await svg.innerHTML();
    expect(svgContent.length).toBeGreaterThan(0);
  });

  test('VIS-SP-3: ScatterPlot has correct dimensions', async ({ page }) => {
    // GIVEN: A ScatterPlot with width=800 and height=300
    // WHEN: The component renders
    await page.click('#show-scatter-plot');

    // THEN: The SVG has correct dimensions
    const svg = page.locator('#chart-container svg');
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');
    expect(width).toBe('800');
    expect(height).toBe('300');
  });

  test('VIS-SP-4: ScatterPlot ID is correct', async ({ page }) => {
    // GIVEN: A ScatterPlot component
    // WHEN: The chart is shown
    await page.click('#show-scatter-plot');

    // THEN: The chart ID is 'scatter-plot'
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('scatter-plot');
  });

  test('VIS-SP-5: ScatterPlot render count is displayed', async ({ page }) => {
    // GIVEN: A rendered ScatterPlot
    // WHEN: The chart is shown
    await page.click('#show-scatter-plot');

    // THEN: The render count is displayed and greater than 0
    const renderCount = await page.locator('#chart-render-count').textContent();
    expect(parseInt(renderCount || '0')).toBeGreaterThan(0);
  });

  test('VIS-SP-6: ScatterPlot renders without console errors', async ({ page }) => {
    // GIVEN: A page ready to show a chart
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: The ScatterPlot is rendered
    await page.click('#show-scatter-plot');
    await page.waitForTimeout(500);

    // THEN: No console errors occurred
    expect(errors).toHaveLength(0);
  });

  test('VIS-SP-7: ScatterPlot is accessible globally', async ({ page }) => {
    // GIVEN: The framework is loaded
    // WHEN: Checking the global Synapse object
    const hasScatterPlot = await page.evaluate(() => {
      return typeof (window as unknown as { Synapse: Record<string, unknown> }).Synapse['ScatterPlot'] !== 'undefined';
    });

    // THEN: ScatterPlot class is available
    expect(hasScatterPlot).toBe(true);
  });

  test('VIS-SP-8: ScatterPlot currentChart is set', async ({ page }) => {
    // GIVEN: A rendered ScatterPlot
    // WHEN: The chart is shown
    await page.click('#show-scatter-plot');

    // THEN: currentChart is set to a ScatterPlot instance
    const isScatterPlot = await page.evaluate(() => {
      const chart = (window as unknown as { Synapse: { currentChart?: { constructor: { name: string } } } }).Synapse.currentChart;
      return chart?.constructor.name === 'ScatterPlot';
    });
    expect(isScatterPlot).toBe(true);
  });

  test('VIS-SP-9: ScatterPlot SVG has viewBox attribute', async ({ page }) => {
    // GIVEN: A ScatterPlot component
    // WHEN: The chart is rendered
    await page.click('#show-scatter-plot');

    // THEN: The SVG has a viewBox attribute
    const svg = page.locator('#chart-container svg');
    const viewBox = await svg.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
  });

  test('VIS-SP-10: ScatterPlot has accessibility role', async ({ page }) => {
    // GIVEN: A ScatterPlot component
    // WHEN: The chart is rendered
    await page.click('#show-scatter-plot');

    // THEN: The SVG has role="img" for accessibility
    const svg = page.locator('#chart-container svg');
    const role = await svg.getAttribute('role');
    expect(role).toBe('img');
  });

  test('VIS-SP-11: ScatterPlot has aria-label', async ({ page }) => {
    // GIVEN: A ScatterPlot component
    // WHEN: The chart is rendered
    await page.click('#show-scatter-plot');

    // THEN: The SVG has an aria-label
    const svg = page.locator('#chart-container svg');
    const ariaLabel = await svg.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('VIS-SP-12: ScatterPlot container is cleared before rendering', async ({ page }) => {
    // GIVEN: A PieChart is already shown
    await page.click('#show-pie-chart');

    // WHEN: Switching to ScatterPlot
    await page.click('#show-scatter-plot');

    // THEN: Only one SVG element is in the container
    const svgCount = await page.locator('#chart-container svg').count();
    expect(svgCount).toBe(1);
  });
});
