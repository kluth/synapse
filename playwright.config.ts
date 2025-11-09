import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration for Synapse Framework
 *
 * Comprehensive cross-browser and cross-device testing:
 * - Desktop: Chrome, Firefox, Safari (multiple resolutions)
 * - Mobile: iPhone (13, 13 Pro, SE), Android (Pixel 5, Galaxy S9+)
 * - Tablet: iPad (gen 7, Pro 11), Galaxy Tab S4
 * - Custom Viewports: 720p, 1080p, 4K
 *
 * Black-box testing via Playwright - no internal code modifications
 * All tests treat the framework as immutable
 */
export default defineConfig({
  // Test directory
  testDir: './e2e/tests',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env['CI'],

  // Retry on CI only
  retries: process.env['CI'] ? 2 : 0,

  // Opt out of parallel tests on CI
  ...(process.env['CI'] ? { workers: 1 } : {}),

  // Reporter to use
  reporter: process.env['CI'] ? [['html'], ['github']] : [['html'], ['list']],

  // Shared settings for all the projects below
  use: {
    // Base URL for page.goto()
    baseURL: 'http://localhost:5173',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers and form factors
  projects: [
    // Desktop Browsers
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Devices - iPhone
    {
      name: 'mobile-iphone-13',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'mobile-iphone-13-pro',
      use: { ...devices['iPhone 13 Pro'] },
    },
    {
      name: 'mobile-iphone-se',
      use: { ...devices['iPhone SE'] },
    },

    // Mobile Devices - Android
    {
      name: 'mobile-pixel-5',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-galaxy-s9',
      use: { ...devices['Galaxy S9+'] },
    },

    // Tablet Devices
    {
      name: 'tablet-ipad',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'tablet-ipad-pro',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'tablet-galaxy-tab',
      use: { ...devices['Galaxy Tab S4'] },
    },

    // Custom Desktop Viewports
    {
      name: 'desktop-1080p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'desktop-4k',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
      },
    },
    {
      name: 'desktop-small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Run dev server before starting the tests
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },
});
