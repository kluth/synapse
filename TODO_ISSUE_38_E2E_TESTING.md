# TODO: Issue #38 - E2E Testing Suite for Synapse

**Issue Number:** #38
**Title:** E2E Testing Suite for Synapse
**Status:** Open
**Created:** 2025-11-08

---

## 🚨 CRITICAL ANALYSIS & AMBIGUITY

### Issue Content Analysis

The issue requests an E2E testing suite but references **Matrix Synapse** (the homeserver) tools and concepts:
- @matrix-org/patience (Matrix testing framework)
- Complement (Matrix homeserver testing tool)
- Server-Server Federation APIs
- Matrix rooms, E2EE, etc.

### Current Project Context

Our project is **@synapse-framework/core** - a TypeScript full-stack framework with neural-inspired architecture:
- VisualNeuron components
- NeuralNode system
- Circulatory (messaging)
- Muscular (business logic)
- Immune (security)
- Visualization components (charts)

### Interpretation Decision

**ASSUMPTION:** This issue needs E2E testing for our **Synapse Framework**, not Matrix Synapse.

**Rationale:**
1. We're working on @synapse-framework/core (not Matrix)
2. We have 1,885 unit/integration tests already
3. We need E2E tests for our framework components
4. The principles (TDD, TypeScript, Clean Code) align with our project

**ACTION REQUIRED:** Confirm with user if this interpretation is correct before proceeding.

---

## 📋 ORIGINAL ISSUE CONTENT

### Brief Description
Create a comprehensive, granular, automated End-to-End (E2E) test suite that treats the system as a black box and interacts exclusively via public APIs.

### Core Principles (Mandatory)

1. **Language & Tooling:**
   - TypeScript with strict mode
   - ~~Patience (@matrix-org/patience)~~ → **TO DECIDE**
   - ~~Playwright for client simulation~~ → **APPLICABLE**
   - ~~Complement for homeserver orchestration~~ → **NOT APPLICABLE**

2. **Methodology (TDD):**
   - Test-Driven Development strictly enforced
   - Write failing test first, then implementation
   - Atomic test cases

3. **Code Quality (Clean Code):**
   - SOLID, DRY, KISS principles
   - Strict ESLint and Prettier
   - Test code = Production code quality

4. **Granularity & Minimal Invasiveness:**
   - Black box testing only
   - No modifications to core code for tests
   - HTTP APIs only
   - One assertion per test

### Acceptance Criteria

- [ ] New test workspace/package initialized
- [ ] TypeScript strict mode configured
- [ ] ESLint/Prettier with pre-commit hooks
- [ ] README.md with setup instructions
- [ ] First smoke test passing
- [ ] CI/CD pipeline configured
- [ ] Test Plan created and reviewed

### Implementation Phases

**Phase 1: Planning & Critical Review**
- Create comprehensive TEST_PLAN.md
- Define all critical user stories
- Use Given-When-Then format
- Team review and approval

**Phase 2: Implementation (TDD)**
- Iterative implementation following TDD
- Granular, atomic tests
- Clean Code principles

---

## 🎯 ADAPTED PLAN FOR SYNAPSE FRAMEWORK

### What We Actually Need to Test (E2E)

Since our framework is for building applications, we need to test:

1. **Component Lifecycle E2E**
   - VisualNeuron activation/deactivation
   - Signal flow through neural network
   - State management across components

2. **Visualization Components E2E**
   - LineChart rendering in browser
   - BarChart interactivity
   - PieChart user interactions
   - ScatterPlot data updates

3. **Business Logic Flow E2E**
   - Muscular system action execution
   - Circulatory message bus
   - Event sourcing patterns

4. **Security E2E**
   - Immune system sanitization
   - Authentication flows
   - Authorization checks

5. **Full Application E2E**
   - Example app (if we build one)
   - Integration between all systems
   - Performance under load

### Recommended Tooling for Our Framework

**Option A: Playwright + Vite/Vitest**
- Playwright for browser E2E
- Vite for dev server
- Vitest for test runner
- Works great with our TypeScript/Bun setup

**Option B: Cypress**
- Alternative to Playwright
- Good TypeScript support
- Component testing support

**Recommended:** Playwright (more modern, better TypeScript support)

---

## 📝 CLEAR, UNAMBIGUOUS IMPLEMENTATION INSTRUCTIONS

### STEP 1: Confirm Scope with User (REQUIRED FIRST)
**DO NOT PROCEED WITHOUT CONFIRMATION**

Ask user:
```
Is this E2E testing suite for:
A) Our Synapse Framework (@synapse-framework/core)
B) Matrix Synapse homeserver
C) Something else?
```

### STEP 2: After Confirmation - Setup (If A)

```bash
# Install Playwright
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install

# Create E2E test directory
mkdir -p e2e/{tests,fixtures,helpers}
```

### STEP 3: Configuration Files

Create these files:
1. `playwright.config.ts` - Playwright configuration
2. `e2e/tsconfig.json` - TypeScript config for E2E tests
3. `e2e/TEST_PLAN.md` - Comprehensive test plan
4. `e2e/README.md` - Setup and run instructions

### STEP 4: Test Plan (Phase 1 - MUST DO FIRST)

Create `e2e/TEST_PLAN.md` with:

#### Section 1: Component Lifecycle Tests
```
Given: A VisualNeuron component is created
When: The component is activated
Then: The component state changes to 'active'

Given: An active VisualNeuron
When: The component receives a signal above threshold
Then: The component processes the signal and fires
```

#### Section 2: Visualization E2E Tests
```
Given: A LineChart is rendered in a browser
When: User hovers over a data point
Then: The hover state is updated visually

Given: A BarChart with data
When: User clicks on a bar
Then: The selection event is emitted with correct data
```

#### Section 3: Integration Tests
```
Given: A complete neural network with multiple nodes
When: A signal is sent to the first node
Then: The signal propagates through the network correctly
```

### STEP 5: First Smoke Test (TDD)

File: `e2e/tests/smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Synapse Framework - Smoke Tests', () => {
  test('should load framework without errors', async ({ page }) => {
    // GIVEN: A page with Synapse loaded
    await page.goto('http://localhost:5173');

    // WHEN: The page loads
    // THEN: No console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
});
```

### STEP 6: Implementation Order (TDD)

For each test:
1. Write the test (RED)
2. Run it - should fail
3. Write minimal code to pass (GREEN)
4. Refactor (REFACTOR)
5. Commit

**Test Order:**
1. Smoke tests (framework loads)
2. Component lifecycle tests
3. Visualization component tests
4. Signal propagation tests
5. Full integration tests

### STEP 7: CI/CD Integration

Add to `.github/workflows/e2e.yml`:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## ✅ ACCEPTANCE CHECKLIST

Before considering this issue complete, ensure:

- [ ] User confirmed scope (Framework vs Matrix)
- [ ] Playwright installed and configured
- [ ] `e2e/` directory structure created
- [ ] `e2e/TEST_PLAN.md` written and reviewed
- [ ] TypeScript strict mode in e2e tests
- [ ] ESLint/Prettier configured for e2e
- [ ] Pre-commit hook includes e2e linting
- [ ] `e2e/README.md` with clear instructions
- [ ] First smoke test written (TDD - failing first)
- [ ] First smoke test passing
- [ ] CI/CD pipeline running e2e tests
- [ ] At least 10 E2E tests passing
- [ ] All tests are atomic (one assertion per test)
- [ ] All tests follow Given-When-Then format
- [ ] Code coverage for critical paths
- [ ] Performance benchmarks included

---

## 🚫 OUT OF SCOPE

- Unit tests (already have 1,885)
- Performance/load testing (separate epic)
- Modifications to core framework code
- Testing third-party dependencies
- Manual testing procedures

---

## 💭 MY THOUGHTS & RECOMMENDATIONS

### Critical Path Forward

1. **Immediate:** Get user clarification on scope
2. **If Framework E2E:** Start with visualization components (already have good unit tests)
3. **Test Real Browser Behavior:** Things like SVG rendering, event handlers, state updates
4. **Build Test App:** May need a simple demo app to run E2E tests against
5. **Focus on Integration:** E2E should test how components work together, not in isolation

### Risks & Challenges

**Risk 1:** No demo application yet
- **Mitigation:** Build minimal demo app in `examples/e2e-demo/`

**Risk 2:** Framework is library, not application
- **Mitigation:** E2E tests validate integration patterns, not full app flows

**Risk 3:** Complexity with neural architecture
- **Mitigation:** Start simple (lifecycle), then add signal propagation tests

### Suggested First 5 Tests (TDD Order)

1. **Smoke:** Framework loads without errors
2. **Lifecycle:** VisualNeuron activates/deactivates
3. **Render:** LineChart renders SVG in DOM
4. **Interaction:** Chart emits event on user click
5. **Signal:** NeuralNode receives and processes signal

### Time Estimate

- **Phase 1 (Planning):** 2-3 hours
- **Setup:** 1-2 hours
- **First 5 tests:** 2-3 hours
- **CI/CD:** 1 hour
- **Total:** 6-9 hours

### Success Criteria

- E2E tests catch real integration bugs
- Tests run in <5 minutes
- CI/CD integration working
- Clear documentation for contributors
- Foundation for future E2E expansion

---

## 📌 NEXT IMMEDIATE ACTIONS

1. **ASK USER:** Confirm this is for Synapse Framework, not Matrix Synapse
2. **READ:** Current examples to understand what can be tested
3. **PLAN:** Write comprehensive TEST_PLAN.md
4. **SETUP:** Install Playwright, create directory structure
5. **TDD:** Write first failing test
6. **IMPLEMENT:** Make it pass
7. **ITERATE:** Continue with next tests

---

**Created:** 2025-11-08
**Last Updated:** 2025-11-08
**Owner:** Claude
**Status:** BLOCKED - Awaiting user clarification on scope
