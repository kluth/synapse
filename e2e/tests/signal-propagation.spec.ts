/**
 * E2E Signal Propagation Tests for Synapse Framework
 *
 * Tests for neural network signal transmission and event handling.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: HIGH
 */

import { test, expect } from '@playwright/test';

test.describe('Signal Propagation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('SIG-1: Network creation button is present', async ({ page }) => {
    // GIVEN: The demo app is loaded
    // WHEN: Checking for network controls
    // THEN: The create network button is visible
    await expect(page.locator('#create-network')).toBeVisible();
  });

  test('SIG-2: Send signal button is initially disabled', async ({ page }) => {
    // GIVEN: The demo app is loaded
    // WHEN: Checking the send signal button
    // THEN: It is disabled until network is created
    const isDisabled = await page.locator('#send-signal').isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('SIG-3: Creating network enables send signal button', async ({ page }) => {
    // GIVEN: No network exists yet
    // WHEN: The create network button is clicked
    await page.click('#create-network');

    // THEN: The send signal button is enabled
    const isDisabled = await page.locator('#send-signal').isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('SIG-4: Creating network updates signal log', async ({ page }) => {
    // GIVEN: The demo app is loaded
    // WHEN: The network is created
    await page.click('#create-network');

    // THEN: The signal log shows network creation message
    const logText = await page.locator('#signal-log').textContent();
    expect(logText).toContain('Neural network created');
  });

  test('SIG-5: Sending signal updates log', async ({ page }) => {
    // GIVEN: A network has been created
    await page.click('#create-network');

    // WHEN: A signal is sent
    await page.click('#send-signal');

    // THEN: The signal log shows the signal was sent
    const logText = await page.locator('#signal-log').textContent();
    expect(logText).toContain('Signal sent');
  });

  test('SIG-6: Create network button is disabled after creation', async ({ page }) => {
    // GIVEN: No network exists
    // WHEN: The network is created
    await page.click('#create-network');

    // THEN: The create network button is disabled
    const isDisabled = await page.locator('#create-network').isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('SIG-7: Signal log is visible', async ({ page }) => {
    // GIVEN: The demo app is loaded
    // WHEN: Checking for the signal log
    // THEN: It is visible
    await expect(page.locator('#signal-log')).toBeVisible();
  });

  test('SIG-8: Multiple signals can be sent', async ({ page }) => {
    // GIVEN: A network has been created
    await page.click('#create-network');

    // WHEN: Multiple signals are sent
    await page.click('#send-signal');
    await page.click('#send-signal');

    // THEN: The log contains multiple signal entries
    const logText = await page.locator('#signal-log').textContent();
    const signalCount = (logText?.match(/Signal sent/g) || []).length;
    expect(signalCount).toBeGreaterThanOrEqual(2);
  });

  test('SIG-9: Signal propagation section is visible', async ({ page }) => {
    // GIVEN: The demo app is loaded
    // WHEN: Checking the page structure
    // THEN: The signal propagation section heading is visible
    await expect(page.locator('h2').filter({ hasText: 'Signal Propagation' })).toBeVisible();
  });

  test('SIG-10: Signal operations occur without console errors', async ({ page }) => {
    // GIVEN: A page ready for signal operations
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: Creating network and sending signals
    await page.click('#create-network');
    await page.click('#send-signal');
    await page.waitForTimeout(500);

    // THEN: No console errors occurred
    expect(errors).toHaveLength(0);
  });
});
