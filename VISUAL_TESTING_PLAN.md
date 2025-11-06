# Visual Testing Implementation Plan

## 🎯 Goal
Add comprehensive visual regression testing to catch unintended UI changes automatically.

## 📊 Testing Layers

### Layer 1: Unit Tests (Jest) ✅ EXISTING
- Logic testing
- State management
- Event handling
- Coverage: 334 tests, targeting 85%+

### Layer 2: Interaction Tests (Storybook) 🆕 NEW
- User interactions within stories
- Keyboard navigation
- Focus management
- Accessibility checks

### Layer 3: Visual Regression (Chromatic) 🆕 NEW
- Pixel-perfect screenshot comparison
- Cross-browser rendering
- Responsive design validation
- Theme/variant testing

### Layer 4: E2E Tests (Playwright) 🆕 NEW
- Full user flows
- Real browser testing
- Performance metrics
- Mobile testing

---

## 🚀 Phase 0.1: Chromatic Setup (Week 1)

### Installation
```bash
npm install --save-dev chromatic
```

### GitHub Actions Integration
```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for Chromatic
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: true  # Don't fail on visual changes
```

### Package.json Scripts
```json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes",
    "chromatic:ci": "chromatic"
  }
}
```

---

## 🚀 Phase 0.2: Interaction Testing (Week 2)

### Installation
```bash
npm install --save-dev @storybook/test @storybook/addon-interactions
```

### Update Storybook Config
```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',  // Already added
  ],
};
```

### Example: Button with Interaction Tests
```typescript
// src/ui/components/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/html';
import { within, userEvent, expect } from '@storybook/test';
import { Button } from './Button';

const meta: Meta = {
  title: 'Components/Button',
  tags: ['autodocs'],
  render: (args) => {
    // ... existing render logic
  },
};

export default meta;
type Story = StoryObj;

// Basic visual story
export const Primary: Story = {
  args: {
    label: 'Click me',
    variant: 'primary',
  },
};

// Interactive story with tests
export const ClickInteraction: Story = {
  args: {
    label: 'Click to test',
    variant: 'primary',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Test 1: Button is visible
    await expect(button).toBeVisible();
    
    // Test 2: Button has correct label
    await expect(button).toHaveTextContent('Click to test');
    
    // Test 3: Click changes state
    await userEvent.click(button);
    await expect(button).toHaveClass(/pressed/);
    
    // Test 4: Verify onClick was called (if tracking)
    // This would check that the neural signal was emitted
  },
};

// Keyboard interaction story
export const KeyboardNavigation: Story = {
  args: {
    label: 'Press Enter',
    variant: 'primary',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Test keyboard interaction
    button.focus();
    await expect(button).toHaveFocus();
    
    await userEvent.keyboard('{Enter}');
    await expect(button).toHaveClass(/pressed/);
  },
};

// Disabled state story
export const DisabledState: Story = {
  args: {
    label: 'Disabled',
    variant: 'primary',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await expect(button).toBeDisabled();
    
    // Try to click (should not work)
    await userEvent.click(button);
    await expect(button).not.toHaveClass(/pressed/);
  },
};
```

### Run Interaction Tests
```bash
npm install --save-dev @storybook/test-runner
npm run test-storybook
```

---

## 🚀 Phase 0.3: Playwright E2E Setup (Week 3)

### Installation
```bash
npm init playwright@latest
```

### Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example E2E Test
```typescript
// tests/e2e/button.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Button Component', () => {
  test('renders correctly in Storybook', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--primary');
    
    const button = page.getByRole('button', { name: 'Click me' });
    await expect(button).toBeVisible();
  });

  test('handles click interactions', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--click-interaction');
    
    const button = page.getByRole('button');
    await button.click();
    
    // Verify pressed state
    await expect(button).toHaveClass(/pressed/);
  });

  test('is accessible via keyboard', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--keyboard-navigation');
    
    const button = page.getByRole('button');
    await button.focus();
    await page.keyboard.press('Enter');
    
    await expect(button).toHaveClass(/pressed/);
  });

  test('respects disabled state', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--disabled-state');
    
    const button = page.getByRole('button');
    await expect(button).toBeDisabled();
  });

  test('visual regression snapshot', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--all-variants');
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('button-variants.png');
  });
});
```

---

## 🚀 Phase 0.4: Accessibility Testing (Week 3)

### Installation
```bash
npm install --save-dev @axe-core/playwright
```

### Example A11y Test
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('Button component has no accessibility violations', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--primary');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('All button variants are accessible', async ({ page }) => {
    await page.goto('/iframe.html?id=components-button--all-variants');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

---

## 📋 TDD Workflow with Visual Testing

### Step-by-Step Process

```typescript
// 1. Write Unit Test (Jest) - Test logic
describe('Button', () => {
  it('should emit click signal when clicked', () => {
    const button = new Button({
      id: 'test-button',
      config: { initialProps: { label: 'Test' } }
    });
    
    // Test neural signal emission
    const signal = button.emitUISignal({ type: 'ui:click' });
    expect(signal.type).toBe('ui:click');
  });
});

// 2. Write Storybook Story with Interaction Test
export const ClickTest: Story = {
  args: { label: 'Click me' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(button).toHaveClass(/pressed/);
  },
};

// 3. Visual Regression (Chromatic - Automatic)
// Just push to GitHub, Chromatic captures screenshots automatically

// 4. Write E2E Test (Playwright) - Full integration
test('button works in real browser', async ({ page }) => {
  await page.goto('/iframe.html?id=components-button--click-test');
  await page.getByRole('button').click();
  await expect(page.getByRole('button')).toHaveClass(/pressed/);
});

// 5. Accessibility Test
test('button is accessible', async ({ page }) => {
  await page.goto('/iframe.html?id=components-button--click-test');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## 🎯 Success Metrics

### Coverage Targets
- ✅ Unit Tests: ≥85% code coverage (Jest)
- 🆕 Interaction Tests: 100% of interactive components (Storybook)
- 🆕 Visual Regression: 100% of components (Chromatic)
- 🆕 E2E Tests: ≥5 critical user flows (Playwright)
- 🆕 Accessibility: 0 violations (axe-core)

### CI Requirements
- ✅ All unit tests pass (334 tests)
- 🆕 All interaction tests pass
- 🆕 No visual regressions (or reviewed and approved)
- 🆕 All E2E tests pass across Chrome/Firefox/Safari
- 🆕 Zero accessibility violations

---

## 📦 Package.json Scripts (Complete)

```json
{
  "scripts": {
    // Existing
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    
    // New - Interaction Testing
    "test:interaction": "test-storybook",
    "test:interaction:watch": "test-storybook --watch",
    
    // New - Visual Regression
    "chromatic": "chromatic --exit-zero-on-changes",
    "chromatic:ci": "chromatic",
    
    // New - E2E Testing
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    
    // New - Accessibility
    "test:a11y": "playwright test tests/e2e/accessibility.spec.ts",
    
    // Combined
    "test:all": "npm run test && npm run test:interaction && npm run test:e2e"
  }
}
```

---

## 🚦 CI Pipeline (Complete)

```yaml
# .github/workflows/ci.yml
name: Comprehensive CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  unit-tests:
    name: Unit Tests (Jest)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4

  interaction-tests:
    name: Interaction Tests (Storybook)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build-storybook
      - run: npm run test:interaction

  visual-regression:
    name: Visual Regression (Chromatic)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
      - run: npm ci
      - uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}

  e2e-tests:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/

  accessibility:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y
```

---

## 📅 Implementation Timeline

### Week 1: Visual Infrastructure
- [ ] Set up Chromatic account
- [ ] Add Chromatic GitHub Action
- [ ] Configure secrets
- [ ] Run first baseline capture
- [ ] Document visual review workflow

### Week 2: Interaction Tests
- [ ] Install Storybook test dependencies
- [ ] Add interaction tests to Button stories
- [ ] Add interaction tests to Input stories
- [ ] Add interaction tests to Select stories
- [ ] Set up test-storybook in CI

### Week 3: E2E Framework
- [ ] Initialize Playwright
- [ ] Configure multi-browser testing
- [ ] Write first E2E test (Button)
- [ ] Add accessibility testing
- [ ] Set up Playwright CI

### Week 4: Coverage Expansion
- [ ] Add interaction tests to remaining components
- [ ] Write E2E tests for critical flows
- [ ] Achieve 100% component visual coverage
- [ ] Document testing best practices

---

## 🎓 Developer Workflow

### Adding a New Component (TDD + Visual)

```bash
# 1. Create test file first
touch src/ui/components/NewComponent.test.ts

# 2. Write failing tests
npm run test:watch

# 3. Implement component
touch src/ui/components/NewComponent.ts

# 4. Tests pass - Create stories
touch src/ui/components/NewComponent.stories.ts

# 5. Add interaction tests to stories
# (edit NewComponent.stories.ts with play functions)

# 6. Run all tests
npm run test:all

# 7. Commit and push
git add .
git commit -m "feat: Add NewComponent with full test coverage"
git push

# 8. Chromatic automatically captures visual baselines
# 9. Review visual changes in PR
# 10. Approve and merge
```

---

## 📊 Reporting

### Visual Regression Reports
- **Location:** Chromatic dashboard (cloud)
- **Frequency:** Every push to PR
- **Review:** Required before merge
- **Retention:** Unlimited history for open source

### E2E Test Reports
- **Location:** `playwright-report/`
- **Frequency:** Every CI run
- **Artifacts:** Screenshots + videos on failure
- **Retention:** 90 days

### Accessibility Reports
- **Location:** Console output + HTML report
- **Frequency:** Every E2E run
- **Format:** axe-core violation details
- **Requirement:** Zero violations to pass

---

## 🎯 Next Immediate Steps

1. **Set up Chromatic** (30 minutes)
   - Create free account at chromatic.com
   - Add project token to GitHub secrets
   - Push to trigger first baseline

2. **Add interaction test to Button** (1 hour)
   - Install @storybook/test
   - Add play function to Primary story
   - Verify in Storybook

3. **Initialize Playwright** (1 hour)
   - Run `npm init playwright@latest`
   - Write first E2E test
   - Add to CI

**Ready to start? Which would you like to tackle first?**
