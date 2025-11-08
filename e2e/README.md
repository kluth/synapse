# E2E Testing Suite for Synapse Framework

End-to-End testing suite for @synapse-framework/core using Playwright.

## 📋 Overview

This E2E test suite validates the Synapse Framework by:
- Testing components in real browser environments
- Verifying user interactions (clicks, hovers, keyboard)
- Validating signal propagation through neural networks
- Ensuring visual rendering is correct
- Testing integration between framework subsystems

**Key Principles:**
- ✅ Black-box testing only (no internal code modifications)
- ✅ Atomic tests (one assertion per test)
- ✅ TDD methodology (test first, then implement)
- ✅ TypeScript strict mode
- ✅ Clean Code principles

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or bun
- Docker (optional, for CI)

### Installation

```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/tests/lifecycle.spec.ts

# Debug mode
npx playwright test --debug
```

### Development Workflow

1. **Start dev server:**
   ```bash
   npm run dev:e2e
   ```

2. **Write test (TDD - RED):**
   ```bash
   vim e2e/tests/your-test.spec.ts
   npm run test:e2e  # Should fail
   ```

3. **Implement feature (GREEN):**
   ```bash
   # Modify demo app or framework
   npm run test:e2e  # Should pass
   ```

4. **Refactor and commit:**
   ```bash
   git add .
   git commit -m "test(e2e): description"
   ```

## 📁 Directory Structure

```
e2e/
├── README.md              # This file
├── TEST_PLAN.md           # Comprehensive test plan (~100 tests)
├── tsconfig.json          # TypeScript config for E2E
├── tests/                 # Test files
│   ├── lifecycle.spec.ts  # Component lifecycle tests
│   ├── charts/            # Chart component tests
│   │   ├── line-chart.spec.ts
│   │   ├── bar-chart.spec.ts
│   │   ├── pie-chart.spec.ts
│   │   └── scatter-plot.spec.ts
│   ├── signals.spec.ts    # Signal propagation tests
│   └── integration.spec.ts # Integration tests
├── fixtures/              # Test data and fixtures
│   └── sample-data.ts
├── helpers/               # Test helper functions
│   └── chart-helpers.ts
└── demo-app/              # Demo app for E2E testing
    ├── index.html
    ├── main.ts
    └── vite.config.ts
```

## 🧪 Writing Tests

### Test Structure

All tests must follow the **Given-When-Then** format with atomic assertions:

```typescript
import { test, expect } from '@playwright/test';

test('LC-1: VisualNeuron activation', async ({ page }) => {
  // GIVEN: A VisualNeuron component is created
  await page.goto('/');
  await page.click('#create-neuron');

  // WHEN: The component is activated
  await page.click('#activate-neuron');

  // THEN: The component state changes to 'active'
  const status = await page.textContent('#neuron-status');
  expect(status).toBe('active');
});
```

### Rules

1. **One assertion per test** - Keep tests atomic
2. **Clear naming** - Use test ID (e.g., LC-1) and description
3. **Given-When-Then** - Structure all tests this way
4. **No sleeps** - Use proper waits (waitForSelector, etc.)
5. **Clean up** - Tests should be independent

### Example: Testing a Chart

```typescript
test('VIS-LC-1: LineChart renders SVG', async ({ page }) => {
  // GIVEN: A LineChart component with data
  await page.goto('/charts/line');

  // WHEN: The component is rendered in a browser
  await page.waitForSelector('svg');

  // THEN: An SVG element appears in the DOM
  const svg = page.locator('svg');
  await expect(svg).toBeVisible();
});
```

## 🎯 Test Categories

See [TEST_PLAN.md](./TEST_PLAN.md) for the complete test plan.

**Priority Levels:**
- 🔴 CRITICAL: Component Lifecycle (~15 tests)
- 🟠 HIGH: Visualization Charts, Signals (~50 tests)
- 🟡 MEDIUM: Integration, Advanced Charts (~35 tests)

## 🔧 Configuration

### Playwright Config

See `playwright.config.ts` in project root.

Key settings:
- Base URL: http://localhost:5173
- Timeout: 30 seconds per test
- Retries: 2 on CI, 0 locally
- Browsers: Chromium (Firefox/WebKit optional)

### TypeScript Config

See `e2e/tsconfig.json`.

Strict mode enabled with:
- Playwright types
- ES2022 target
- Node module resolution

## 🚦 CI/CD Integration

Tests run automatically on:
- Every push to main
- Every pull request
- Nightly builds (full suite)

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
- run: npx playwright install --with-deps
- run: npm run test:e2e
```

## 📊 Test Reports

After running tests:

```bash
# View HTML report
npx playwright show-report

# Reports are in playwright-report/
```

## 🐛 Debugging

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

### Debug Mode

```bash
npx playwright test --debug
```

### Trace Viewer

```bash
npx playwright show-trace trace.zip
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [TEST_PLAN.md](./TEST_PLAN.md) - Full test plan
- [Issue #38](https://github.com/kluth/synapse/issues/38) - Original issue

## ✅ Acceptance Criteria

- [x] TypeScript strict mode configured
- [x] ESLint/Prettier setup
- [x] README with instructions
- [x] Comprehensive TEST_PLAN.md
- [ ] First smoke test passing
- [ ] CI/CD pipeline configured
- [ ] 10+ E2E tests passing

## 🤝 Contributing

1. Check TEST_PLAN.md for unclaimed tests
2. Write the test first (TDD)
3. Make it pass
4. Ensure Clean Code principles
5. Submit PR with test + implementation

---

**Status:** Phase 1 Complete - Ready for Implementation
**Last Updated:** 2025-11-08
