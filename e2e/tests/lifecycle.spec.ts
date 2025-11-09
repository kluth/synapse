/**
 * E2E Component Lifecycle Tests for Synapse Framework
 *
 * Tests for VisualNeuron activation, deactivation, and state management.
 * Following TDD principles with Given-When-Then format.
 *
 * Priority: CRITICAL
 */

import { test, expect } from '@playwright/test';

test.describe('Component Lifecycle Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('LC-1: VisualNeuron activation changes state to active', async ({ page }) => {
    // GIVEN: A VisualNeuron component is created
    await page.click('#create-neuron');

    // WHEN: The component is activated
    await page.click('#activate-neuron');

    // THEN: The component state changes to 'active'
    const status = await page.locator('#neuron-status').textContent();
    expect(status).toBe('active');
  });

  test('LC-2: VisualNeuron deactivation changes state to inactive', async ({ page }) => {
    // GIVEN: An active VisualNeuron component
    await page.click('#create-neuron');
    await page.click('#activate-neuron');

    // WHEN: The component is deactivated
    await page.click('#deactivate-neuron');

    // THEN: The component state changes to 'inactive'
    const status = await page.locator('#neuron-status').textContent();
    expect(status).toBe('inactive');
  });

  test('LC-3: Component activation updates status class', async ({ page }) => {
    // GIVEN: A created VisualNeuron component
    await page.click('#create-neuron');

    // WHEN: The component is activated
    await page.click('#activate-neuron');

    // THEN: The status element has 'active' class
    const statusClass = await page.locator('#neuron-status').getAttribute('class');
    expect(statusClass).toContain('active');
  });

  test('LC-4: Component deactivation updates status class', async ({ page }) => {
    // GIVEN: An active VisualNeuron component
    await page.click('#create-neuron');
    await page.click('#activate-neuron');

    // WHEN: The component is deactivated
    await page.click('#deactivate-neuron');

    // THEN: The status element has 'inactive' class
    const statusClass = await page.locator('#neuron-status').getAttribute('class');
    expect(statusClass).toContain('inactive');
  });

  test('LC-5: Created component starts with inactive status', async ({ page }) => {
    // GIVEN: A VisualNeuron is being created
    // WHEN: The create button is clicked
    await page.click('#create-neuron');

    // THEN: The component status is 'created' (not active yet)
    const status = await page.locator('#neuron-status').textContent();
    expect(status).toBe('created');
  });

  test('LC-6: Activation increments render count', async ({ page }) => {
    // GIVEN: A created VisualNeuron
    await page.click('#create-neuron');

    // WHEN: The component is activated
    await page.click('#activate-neuron');

    // THEN: The render count is greater than 0
    const renderCount = await page.locator('#render-count').textContent();
    expect(parseInt(renderCount || '0')).toBeGreaterThan(0);
  });

  test('LC-7: Activate button is disabled after activation', async ({ page }) => {
    // GIVEN: A created VisualNeuron
    await page.click('#create-neuron');

    // WHEN: The component is activated
    await page.click('#activate-neuron');

    // THEN: The activate button is disabled
    const isDisabled = await page.locator('#activate-neuron').isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('LC-8: Deactivate button is enabled after activation', async ({ page }) => {
    // GIVEN: A created VisualNeuron
    await page.click('#create-neuron');

    // WHEN: The component is activated
    await page.click('#activate-neuron');

    // THEN: The deactivate button is enabled
    const isDisabled = await page.locator('#deactivate-neuron').isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('LC-9: Deactivate button is disabled after deactivation', async ({ page }) => {
    // GIVEN: An active VisualNeuron
    await page.click('#create-neuron');
    await page.click('#activate-neuron');

    // WHEN: The component is deactivated
    await page.click('#deactivate-neuron');

    // THEN: The deactivate button is disabled
    const isDisabled = await page.locator('#deactivate-neuron').isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('LC-10: Activate button is re-enabled after deactivation', async ({ page }) => {
    // GIVEN: An active VisualNeuron
    await page.click('#create-neuron');
    await page.click('#activate-neuron');

    // WHEN: The component is deactivated
    await page.click('#deactivate-neuron');

    // THEN: The activate button is re-enabled
    const isDisabled = await page.locator('#activate-neuron').isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('LC-11: Create button is disabled after creation', async ({ page }) => {
    // GIVEN: The initial state
    // WHEN: A neuron is created
    await page.click('#create-neuron');

    // THEN: The create button is disabled
    const isDisabled = await page.locator('#create-neuron').isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('LC-12: Framework exposes VisualNeuron class globally', async ({ page }) => {
    // GIVEN: The framework is loaded
    // WHEN: Checking the global Synapse object
    const hasVisualNeuron = await page.evaluate(() => {
      return typeof (window as unknown as { Synapse: Record<string, unknown> }).Synapse['VisualNeuron'] !== 'undefined';
    });

    // THEN: VisualNeuron class is available
    expect(hasVisualNeuron).toBe(true);
  });

  test('LC-13: Component ID is accessible via framework', async ({ page }) => {
    // GIVEN: A created neuron
    await page.click('#create-neuron');
    await page.click('#activate-neuron');

    // WHEN: Accessing the neuron ID through the framework
    const neuronId = await page.evaluate(() => {
      const neuron = (window as unknown as { Synapse: { currentNeuron?: { id?: string } } }).Synapse.currentNeuron;
      return neuron ? neuron.id : null;
    });

    // THEN: The neuron ID is 'test-neuron'
    expect(neuronId).toBe('test-neuron');
  });

  test('LC-14: Component getRenderCount method works correctly', async ({ page }) => {
    // GIVEN: An activated neuron
    await page.click('#create-neuron');
    await page.click('#activate-neuron');

    // WHEN: Calling getRenderCount via framework
    const renderCount = await page.evaluate(() => {
      const neuron = (window as unknown as { Synapse: { currentNeuron?: { getRenderCount?: () => number } } }).Synapse.currentNeuron;
      return neuron?.getRenderCount ? neuron.getRenderCount() : 0;
    });

    // THEN: Render count matches the displayed value
    const displayedCount = await page.locator('#render-count').textContent();
    expect(renderCount).toBe(parseInt(displayedCount || '0'));
  });

  test('LC-15: Component lifecycle completes without console errors', async ({ page }) => {
    // GIVEN: A page ready to create a neuron
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // WHEN: Going through full lifecycle (create, activate, deactivate)
    await page.click('#create-neuron');
    await page.click('#activate-neuron');
    await page.click('#deactivate-neuron');

    // THEN: No console errors occurred
    expect(errors).toHaveLength(0);
  });
});
