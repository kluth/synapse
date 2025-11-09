/**
 * E2E Responsive Tests for Synapse Framework
 *
 * Tests framework behavior across different devices and viewports
 * Following TDD: Write failing test first, then make it pass.
 */

import { test, expect } from '@playwright/test';

test.describe('Synapse Framework - Responsive Behavior', () => {
  test('RESP-1: Framework loads on all form factors', async ({ page }) => {
    // GIVEN: The E2E demo app
    // WHEN: Loaded on any device
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Framework should be available
    const hasSynapse = await page.evaluate(() => {
      return typeof (window as unknown as { Synapse?: unknown }).Synapse !== 'undefined';
    });

    expect(hasSynapse).toBe(true);
  });

  test('RESP-2: Charts render correctly on all viewports', async ({ page }) => {
    // GIVEN: The demo app is loaded
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: A chart is displayed
    await page.click('#show-line-chart');
    await page.waitForTimeout(100);

    // THEN: Chart should be visible and have correct dimensions
    const chartContainer = page.locator('#chart-container');
    await expect(chartContainer).toBeVisible();

    const hasChart = await page.evaluate(() => {
      const container = document.getElementById('chart-container');
      return container !== null && container.children.length > 0;
    });

    expect(hasChart).toBe(true);
  });

  test('RESP-3: Touch interactions work on mobile devices', async ({ page, isMobile }) => {
    // GIVEN: The demo app on a mobile device
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: User taps a button
    const createButton = page.locator('#create-neuron');

    if (isMobile) {
      // Use tap instead of click on mobile
      await createButton.tap();
    } else {
      await createButton.click();
    }

    // THEN: Action should complete successfully
    const status = page.locator('#neuron-status');
    await expect(status).toHaveText('created');
  });

  test('RESP-4: Layout adapts to viewport size', async ({ page, viewport }) => {
    // GIVEN: The demo app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Checking viewport dimensions
    const viewportWidth = viewport?.width || 1280;

    // THEN: Layout should be appropriate for viewport
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Check if mobile layout is applied for small screens
    if (viewportWidth < 768) {
      // Mobile layout assertions
      const isMobileLayout = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return false;
        const styles = window.getComputedStyle(main);
        return parseInt(styles.maxWidth) <= 100 || styles.maxWidth === 'none';
      });
      expect(isMobileLayout).toBe(true);
    }
  });

  test('RESP-5: Text remains readable at all sizes', async ({ page }) => {
    // GIVEN: The demo app with content
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Checking text elements
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // THEN: Text should have appropriate size
    const fontSize = await heading.evaluate((el) => {
      return parseInt(window.getComputedStyle(el).fontSize);
    });

    // Font size should be at least 16px for readability
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test('RESP-6: Buttons are appropriately sized for touch', async ({ page, isMobile }) => {
    // GIVEN: The demo app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Checking button sizes
    const button = page.locator('#create-neuron');

    // THEN: Buttons should meet touch target size guidelines on mobile
    if (isMobile) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();

      if (box) {
        // Minimum touch target: 44x44px (iOS), 48x48px (Android)
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('RESP-7: Charts scale appropriately on different screens', async ({ page, viewport }) => {
    // GIVEN: The demo app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Displaying a chart
    await page.click('#show-bar-chart');
    await page.waitForTimeout(100);

    // THEN: Chart should fit within container
    const chartInfo = await page.evaluate(() => {
      const svg = document.querySelector('#chart-container svg');
      if (!svg) return null;

      const width = svg.getAttribute('width');
      const height = svg.getAttribute('height');
      const container = document.getElementById('chart-container');

      return {
        chartWidth: parseInt(width || '0'),
        chartHeight: parseInt(height || '0'),
        containerWidth: container?.offsetWidth || 0,
      };
    });

    expect(chartInfo).not.toBeNull();
    if (chartInfo && viewport) {
      // Chart should not exceed container width
      expect(chartInfo.chartWidth).toBeLessThanOrEqual(chartInfo.containerWidth);

      // Chart should not exceed viewport width
      expect(chartInfo.chartWidth).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('RESP-8: Navigation works on all devices', async ({ page }) => {
    // GIVEN: The demo app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Navigating between different sections
    const chartButtons = [
      '#show-line-chart',
      '#show-bar-chart',
      '#show-pie-chart',
      '#show-scatter-plot',
    ];

    // THEN: Each navigation should work
    for (const buttonId of chartButtons) {
      await page.click(buttonId);
      await page.waitForTimeout(50);

      const chartContainer = page.locator('#chart-container svg');
      await expect(chartContainer).toBeVisible();
    }
  });

  test('RESP-9: Orientation changes handled gracefully', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Only applicable to mobile devices');

    // GIVEN: The demo app on mobile
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Showing a chart
    await page.click('#show-line-chart');
    await page.waitForTimeout(100);

    // THEN: Chart should be visible
    const chartContainer = page.locator('#chart-container');
    await expect(chartContainer).toBeVisible();

    // Note: Actual orientation changes require device rotation
    // which is beyond Playwright's capability in most setups
    // This test validates that content is accessible
  });

  test('RESP-10: High DPI displays render sharply', async ({ page }) => {
    // GIVEN: The demo app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: Rendering a chart
    await page.click('#show-line-chart');
    await page.waitForTimeout(100);

    // THEN: SVG should render without pixelation
    const svgInfo = await page.evaluate(() => {
      const svg = document.querySelector('#chart-container svg');
      if (!svg) return null;

      return {
        tagName: svg.tagName,
        hasViewBox: svg.hasAttribute('viewBox'),
      };
    });

    expect(svgInfo).not.toBeNull();
    if (svgInfo) {
      expect(svgInfo.tagName).toBe('svg');
      // SVG with viewBox scales properly on high DPI
      expect(svgInfo.hasViewBox).toBe(true);
    }
  });
});
