/**
 * Chart test helper functions for E2E tests
 */

import type { Page } from '@playwright/test';

/**
 * Show a specific chart type in the demo app
 * @param page - Playwright page object
 * @param chartType - Type of chart to show ('line', 'bar', 'pie', 'scatter')
 */
export async function showChart(
  page: Page,
  chartType: 'line' | 'bar' | 'pie' | 'scatter'
): Promise<void> {
  const buttonMap: Record<string, string> = {
    line: '#show-line-chart',
    bar: '#show-bar-chart',
    pie: '#show-pie-chart',
    scatter: '#show-scatter-plot',
  };

  const buttonSelector = buttonMap[chartType];
  if (!buttonSelector) {
    throw new Error(`Unknown chart type: ${chartType}`);
  }

  await page.click(buttonSelector);
  await page.waitForTimeout(100); // Give chart time to render
}
