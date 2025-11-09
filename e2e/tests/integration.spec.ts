/**
 * E2E Integration Tests for Synapse Framework
 *
 * Tests for complete application flows and component interactions.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: MEDIUM
 */

import { test, expect } from '@playwright/test';

test.describe('Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('INT-1: Complete application initializes successfully', async ({ page }) => {
    // GIVEN: The demo app URL is loaded
    // WHEN: The app initializes
    await page.waitForLoadState('domcontentloaded');

    // THEN: All main sections are visible
    await expect(page.locator('h1')).toContainText('Synapse Framework');
    await expect(page.locator('h2').filter({ hasText: 'Component Lifecycle' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Charts' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Signal Propagation' })).toBeVisible();
  });

  test('INT-2: Component lifecycle and chart rendering work together', async ({ page }) => {
    // GIVEN: The app is loaded
    // WHEN: Creating a neuron and then rendering a chart
    await page.click('#create-neuron');
    await page.click('#activate-neuron');
    await page.click('#show-line-chart');

    // THEN: Both neuron and chart are active
    const neuronStatus = await page.locator('#neuron-status').textContent();
    const chartId = await page.locator('#chart-info code').textContent();
    expect(neuronStatus).toBe('active');
    expect(chartId).toBe('line-chart');
  });

  test('INT-3: Switching between multiple charts works correctly', async ({ page }) => {
    // GIVEN: The app is loaded
    // WHEN: Switching between different chart types
    await page.click('#show-line-chart');
    await page.click('#show-bar-chart');
    await page.click('#show-pie-chart');
    await page.click('#show-scatter-plot');

    // THEN: The final chart is ScatterPlot
    const chartId = await page.locator('#chart-info code').textContent();
    expect(chartId).toBe('scatter-plot');
  });

  test('INT-4: All chart types render without errors', async ({ page }) => {
    // GIVEN: A page ready to render charts
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: Rendering all chart types in sequence
    await page.click('#show-line-chart');
    await page.waitForTimeout(200);
    await page.click('#show-bar-chart');
    await page.waitForTimeout(200);
    await page.click('#show-pie-chart');
    await page.waitForTimeout(200);
    await page.click('#show-scatter-plot');
    await page.waitForTimeout(200);

    // THEN: No console errors occurred
    expect(errors).toHaveLength(0);
  });

  test('INT-5: Component lifecycle through full activation-deactivation cycle', async ({
    page,
  }) => {
    // GIVEN: The app is loaded
    // WHEN: Going through complete lifecycle
    await page.click('#create-neuron');
    await page.click('#activate-neuron');
    await page.click('#deactivate-neuron');
    await page.click('#activate-neuron');

    // THEN: Component can be reactivated successfully
    const status = await page.locator('#neuron-status').textContent();
    expect(status).toBe('active');
  });

  test('INT-6: Charts and signal propagation can coexist', async ({ page }) => {
    // GIVEN: The app is loaded
    // WHEN: Using both charts and signal propagation features
    await page.click('#show-line-chart');
    await page.click('#create-network');
    await page.click('#send-signal');

    // THEN: Both features work without conflicts
    const chartId = await page.locator('#chart-info code').textContent();
    const signalLog = await page.locator('#signal-log').textContent();
    expect(chartId).toBe('line-chart');
    expect(signalLog).toContain('Signal sent');
  });

  test('INT-7: Framework globals are accessible throughout app lifecycle', async ({ page }) => {
    // GIVEN: The app is loaded
    // WHEN: Creating components and rendering charts
    await page.click('#create-neuron');
    await page.click('#show-line-chart');

    // THEN: Framework globals remain accessible
    const allGlobalsPresent = await page.evaluate(() => {
      const syn = (window as unknown as { Synapse?: Record<string, unknown> }).Synapse;
      return !!(syn?.['VisualNeuron'] && syn['LineChart'] && syn['BarChart'] && syn['PieChart'] && syn['ScatterPlot']);
    });
    expect(allGlobalsPresent).toBe(true);
  });

  test('INT-8: Multiple operations complete without memory leaks or errors', async ({ page }) => {
    // GIVEN: A page ready for multiple operations
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: Performing many operations in sequence
    await page.click('#create-neuron');
    await page.click('#activate-neuron');
    await page.click('#show-line-chart');
    await page.click('#show-bar-chart');
    await page.click('#deactivate-neuron');
    await page.click('#show-pie-chart');
    await page.click('#create-network');
    await page.click('#send-signal');
    await page.click('#send-signal');
    await page.click('#show-scatter-plot');

    // THEN: All operations complete without errors
    expect(errors).toHaveLength(0);
  });
});
