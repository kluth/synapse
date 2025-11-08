/**
 * E2E Smoke Tests for Synapse Framework
 *
 * These are the most basic tests to ensure the framework loads
 * and runs without critical errors.
 *
 * Following TDD: Write failing test first, then make it pass.
 */

import { test, expect } from '@playwright/test';

test.describe('Synapse Framework - Smoke Tests', () => {
  test('SMOKE-1: Framework loads without console errors', async ({ page }) => {
    // GIVEN: A page that should load the Synapse framework
    const errors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: The page is loaded
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No console errors should be present
    expect(errors).toHaveLength(0);
  });

  test('SMOKE-2: Page title is correct', async ({ page }) => {
    // GIVEN: The E2E demo app
    // WHEN: The page is loaded
    await page.goto('/');

    // THEN: The title matches expected value
    await expect(page).toHaveTitle(/Synapse Framework/);
  });

  test('SMOKE-3: Main sections are visible', async ({ page }) => {
    // GIVEN: The E2E demo app
    await page.goto('/');

    // WHEN: The page is fully loaded
    await page.waitForLoadState('domcontentloaded');

    // THEN: All main sections should be visible
    await expect(page.locator('h1')).toContainText('Synapse Framework');
    await expect(page.locator('h2').filter({ hasText: 'Component Lifecycle' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Charts' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Signal Propagation' })).toBeVisible();
  });

  test('SMOKE-4: Control buttons are present', async ({ page }) => {
    // GIVEN: The E2E demo app
    await page.goto('/');

    // WHEN: The page is loaded
    // THEN: Key control buttons should exist
    await expect(page.locator('#create-neuron')).toBeVisible();
    await expect(page.locator('#show-line-chart')).toBeVisible();
    await expect(page.locator('#show-bar-chart')).toBeVisible();
    await expect(page.locator('#show-pie-chart')).toBeVisible();
    await expect(page.locator('#show-scatter-plot')).toBeVisible();
  });

  test('SMOKE-5: Synapse framework is available globally', async ({ page }) => {
    // GIVEN: The E2E demo app with framework loaded
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Checking for global Synapse object
    // THEN: It should be available with expected properties
    const hasSynapse = await page.evaluate(() => {
      return typeof (window as any).Synapse !== 'undefined';
    });

    expect(hasSynapse).toBe(true);

    const hasClasses = await page.evaluate(() => {
      const syn = (window as any).Synapse;
      return (
        typeof syn.VisualNeuron !== 'undefined' &&
        typeof syn.LineChart !== 'undefined' &&
        typeof syn.BarChart !== 'undefined' &&
        typeof syn.PieChart !== 'undefined' &&
        typeof syn.ScatterPlot !== 'undefined'
      );
    });

    expect(hasClasses).toBe(true);
  });
});
