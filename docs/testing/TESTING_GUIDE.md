# Synapse Testing Guide

Comprehensive guide to testing Synapse applications using the Theater System and standard testing tools.

## Table of Contents

- [Overview](#overview)
- [Theater System](#theater-system)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Test Patterns](#test-patterns)
- [Best Practices](#best-practices)

## Overview

Synapse provides a complete testing ecosystem through the **Theater System**, inspired by how medical students learn anatomy through observation and experimentation.

### Testing Pyramid

```
         /\
        /E2E\       <- Few, slow, high confidence
       /------\
      /  Integ \    <- Some, medium speed
     /----------\
    /   Unit     \  <- Many, fast, focused
   /--------------\
```

## Theater System

The Theater System provides a complete development and testing environment.

### Components

1. **Stage** - Test runner and component mounting
2. **Laboratory** - Test orchestration and experiments
3. **Hypothesis** - Assertions and expectations
4. **Amphitheater** - Component gallery and documentation
5. **Instruments** - Profiling, tracing, and monitoring

### Quick Start

```typescript
import { Stage, Laboratory, Hypothesis } from '@synapse-framework/core';

// Create a stage
const stage = new Stage({
  title: 'My Component Tests',
  darkMode: false,
});

// Mount component
stage.mount('my-component', MyComponent);

// Create laboratory
const lab = new Laboratory({
  stage,
  verbose: true,
});

// Define experiment (test)
lab.experiment('should process data correctly', async () => {
  const component = stage.getComponent('my-component');
  const result = await component.process({ data: 'test' });

  Hypothesis.expect(result.success).toBe(true);
  Hypothesis.expect(result.data).toEqual({ processed: 'test' });
});

// Run experiments
await lab.runAll();
```

## Unit Testing

### Testing NeuralNodes

```typescript
import { NeuralNode } from '@synapse-framework/core';
import { describe, it, expect } from '@jest/globals';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    service = new UserService({
      id: 'test-service',
      type: 'cortical',
      threshold: 0.5,
    });

    await service.activate();
  });

  afterEach(async () => {
    await service.deactivate();
  });

  it('should activate successfully', () => {
    expect(service.getStatus()).toBe('active');
  });

  it('should process signals above threshold', async () => {
    // Send signals
    await service.receive({
      id: '1',
      sourceId: 'test',
      type: 'excitatory',
      strength: 0.6,
      payload: { action: 'create' },
      timestamp: new Date(),
    });

    // Check integration
    const decision = service.integrate();
    expect(decision.shouldFire).toBe(true);
  });

  it('should maintain state across calls', async () => {
    await service.process({ data: { userId: '123' } });

    const state = service.getState();
    expect(state.userId).toBe('123');
  });

  it('should emit health metrics', () => {
    const health = service.healthCheck();

    expect(health.healthy).toBe(true);
    expect(health.errors).toBe(0);
    expect(health.uptime).toBeGreaterThan(0);
  });
});
```

### Testing with Theater

```typescript
import { Stage, Laboratory, Hypothesis, TestSubject } from '@synapse-framework/core';

describe('UserService (Theater)', () => {
  const stage = new Stage({ title: 'UserService Tests' });
  const lab = new Laboratory({ stage });

  beforeAll(async () => {
    // Mount service on stage
    stage.mount('user-service', new UserService());
    await stage.start();
  });

  afterAll(async () => {
    await stage.stop();
  });

  lab.experiment('should create user', async () => {
    const service = stage.getComponent('user-service');

    const result = await service.createUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    Hypothesis.expect(result.id).toBeDefined();
    Hypothesis.expect(result.email).toBe('test@example.com');
  });

  lab.experiment('should validate email format', async () => {
    const service = stage.getComponent('user-service');

    await Hypothesis.expectAsync(
      service.createUser({
        email: 'invalid-email',
        name: 'Test User',
      })
    ).toReject();
  });

  // Run all experiments
  it('runs all experiments', async () => {
    const results = await lab.runAll();
    expect(results.passed).toBe(results.total);
  });
});
```

### Testing Muscles (Pure Functions)

```typescript
import { Muscle } from '@synapse-framework/core';

describe('DataTransform Muscle', () => {
  const transform = new Muscle(
    'transform',
    (data: { value: number }) => ({
      value: data.value * 2,
    }),
    { deterministic: true }
  );

  it('should transform data', () => {
    const result = transform.execute({ value: 5 });
    expect(result.value).toBe(10);
  });

  it('should cache deterministic results', () => {
    const input = { value: 7 };

    // First call
    const result1 = transform.execute(input);

    // Second call should use cache
    const result2 = transform.execute(input);

    expect(result1).toBe(result2); // Same object reference
  });

  it('should validate input schema', () => {
    const muscle = new Muscle(
      'validated',
      (data: number) => data * 2,
      {
        inputSchema: new Bone('Number', z.number()),
      }
    );

    expect(() => muscle.execute('invalid')).toThrow();
  });
});
```

### Testing Circular System

```typescript
import { Heart, PublishSubscribe } from '@synapse-framework/core';

describe('PublishSubscribe', () => {
  let heart: Heart;
  let pubsub: PublishSubscribe;

  beforeEach(() => {
    heart = new Heart();
    pubsub = new PublishSubscribe(heart);
  });

  it('should deliver messages to subscribers', (done) => {
    pubsub.subscribe('test.event', (data) => {
      expect(data.message).toBe('Hello');
      done();
    });

    pubsub.publish('test.event', { message: 'Hello' });
  });

  it('should support multiple subscribers', async () => {
    const received: number[] = [];

    pubsub.subscribe('test.event', () => received.push(1));
    pubsub.subscribe('test.event', () => received.push(2));

    await pubsub.publish('test.event', {});

    // Give time for async processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(received).toEqual([1, 2]);
  });

  it('should support wildcard subscriptions', (done) => {
    pubsub.subscribe('user.*', (data) => {
      expect(data.action).toBe('created');
      done();
    });

    pubsub.publish('user.created', { action: 'created' });
  });
});
```

### Testing Immune System

```typescript
import { TCell, BCell, Macrophage } from '@synapse-framework/core';

describe('Security Layer', () => {
  let auth: TCell;
  let authz: BCell;
  let sanitizer: Macrophage;

  beforeEach(async () => {
    auth = new TCell({
      id: 'test-auth',
      algorithm: 'HS256',
      secretKey: 'test-secret',
    });

    authz = new BCell({ id: 'test-authz' });

    sanitizer = new Macrophage({
      id: 'test-sanitizer',
      xss: true,
    });

    await auth.activate();
    await authz.activate();
    await sanitizer.activate();
  });

  describe('Authentication', () => {
    it('should create valid tokens', async () => {
      const result = await auth.createToken({
        userId: '123',
        email: 'test@example.com',
        issuedAt: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should verify valid tokens', async () => {
      const { token } = await auth.createToken({
        userId: '123',
        email: 'test@example.com',
        issuedAt: new Date(),
      });

      const verification = await auth.verifyToken(token!);

      expect(verification.valid).toBe(true);
      expect(verification.session?.userId).toBe('123');
    });

    it('should reject expired tokens', async () => {
      // Create auth with very short expiration
      const shortAuth = new TCell({
        id: 'short-auth',
        algorithm: 'HS256',
        secretKey: 'test-secret',
        expiresIn: '1ms',
      });

      const { token } = await shortAuth.createToken({
        userId: '123',
        email: 'test@example.com',
        issuedAt: new Date(),
      });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const verification = await shortAuth.verifyToken(token!);
      expect(verification.valid).toBe(false);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      authz.createPermission({
        id: 'users:read',
        resource: 'users',
        action: 'read',
      });

      authz.createRole({
        id: 'user',
        name: 'User',
        permissions: ['users:read'],
      });

      authz.assignRole('user-123', 'user');
    });

    it('should allow authorized actions', async () => {
      const result = await authz.authorize({
        userId: 'user-123',
        resource: 'users',
        action: 'read',
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny unauthorized actions', async () => {
      const result = await authz.authorize({
        userId: 'user-123',
        resource: 'users',
        action: 'delete',
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('Sanitization', () => {
    it('should remove XSS attempts', () => {
      const result = sanitizer.sanitize({
        comment: '<script>alert("xss")</script>',
      });

      expect(result.safe).toBe(true);
      expect(result.sanitized.comment).not.toContain('<script>');
    });

    it('should detect threats', () => {
      const result = sanitizer.sanitize({
        query: "'; DROP TABLE users; --",
      });

      expect(result.threats.length).toBeGreaterThan(0);
      expect(result.threats[0].type).toBe('sql-injection');
    });
  });
});
```

## Integration Testing

### Testing System Interactions

```typescript
import {
  Heart,
  PublishSubscribe,
  CorticalNeuron,
  Astrocyte,
  TCell,
  BCell,
} from '@synapse-framework/core';

describe('User Registration Flow', () => {
  let heart: Heart;
  let pubsub: PublishSubscribe;
  let userService: UserService;
  let emailService: EmailService;
  let cache: Astrocyte;
  let auth: TCell;
  let authz: BCell;

  beforeEach(async () => {
    // Set up infrastructure
    heart = new Heart();
    pubsub = new PublishSubscribe(heart);
    cache = new Astrocyte({ id: 'cache' });
    auth = new TCell({
      id: 'auth',
      algorithm: 'HS256',
      secretKey: 'test-secret',
    });
    authz = new BCell({ id: 'authz' });

    // Set up services
    userService = new UserService({ cache, auth, authz, pubsub });
    emailService = new EmailService({ pubsub });

    // Activate everything
    await cache.activate();
    await auth.activate();
    await authz.activate();
    await userService.activate();
    await emailService.activate();
  });

  afterEach(async () => {
    await userService.deactivate();
    await emailService.deactivate();
    await cache.deactivate();
  });

  it('should complete full registration flow', async () => {
    const emailSent = new Promise((resolve) => {
      pubsub.subscribe('email.sent', resolve);
    });

    // Register user
    const user = await userService.register({
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      name: 'New User',
    });

    // Verify user created
    expect(user.id).toBeDefined();
    expect(user.email).toBe('newuser@example.com');

    // Verify cached
    const cached = cache.get(`user:${user.id}`);
    expect(cached).toBeDefined();

    // Verify email sent
    await emailSent;

    // Verify can login
    const token = await userService.login({
      email: 'newuser@example.com',
      password: 'SecurePass123!',
    });

    expect(token).toBeDefined();

    // Verify token works
    const session = await auth.verifyToken(token);
    expect(session.valid).toBe(true);
  });
});
```

### Testing with Test Containers

```typescript
import { Stage, Laboratory } from '@synapse-framework/core';

describe('Database Integration', () => {
  const stage = new Stage({ title: 'DB Tests' });
  const lab = new Laboratory({ stage });

  let database: Database;

  beforeAll(async () => {
    // In real tests, use testcontainers for database
    database = await setupTestDatabase();
    stage.mount('db', database);
    await stage.start();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await stage.stop();
  });

  lab.experiment('should persist and retrieve data', async () => {
    const db = stage.getComponent('db');

    const user = await db.users.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    const retrieved = await db.users.findById(user.id);

    Hypothesis.expect(retrieved).toEqual(user);
  });
});
```

## E2E Testing

Synapse uses Playwright for end-to-end testing.

### Basic E2E Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test('should register new user', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:3000/register');

    // Fill form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'New User');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('http://localhost:3000/register');

    // Submit without filling form
    await page.click('button[type="submit"]');

    // Verify errors
    await expect(page.locator('.error-message')).toContainText('Email is required');
  });
});
```

### Testing WebSocket Communication

```typescript
import { test, expect } from '@playwright/test';

test('should receive real-time updates', async ({ page }) => {
  await page.goto('http://localhost:3000/chat');

  // Wait for WebSocket connection
  await page.waitForSelector('.connected-indicator');

  // Listen for messages
  const messagePromise = page.waitForSelector('.message:has-text("Hello")');

  // Trigger message from another source
  await sendMessageViaAPI('Hello');

  // Verify received
  await messagePromise;
});
```

## Test Patterns

### Pattern 1: Arrange-Act-Assert

```typescript
it('should process user data', async () => {
  // Arrange
  const service = new UserService();
  await service.activate();
  const input = { name: 'Alice', email: 'alice@example.com' };

  // Act
  const result = await service.process(input);

  // Assert
  expect(result.success).toBe(true);
  expect(result.data.name).toBe('Alice');
});
```

### Pattern 2: Given-When-Then

```typescript
lab.experiment('user creation', async () => {
  // Given: A new user registration request
  const request = {
    email: 'test@example.com',
    password: 'SecurePass123!',
  };

  // When: The user is registered
  const user = await userService.register(request);

  // Then: The user should be created and cached
  Hypothesis.expect(user.id).toBeDefined();
  Hypothesis.expect(cache.get(`user:${user.id}`)).toBeDefined();
});
```

### Pattern 3: Test Fixtures

```typescript
class TestFixtures {
  static async createUser(overrides = {}) {
    return {
      id: crypto.randomUUID(),
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static async createAuthToken(userId: string) {
    const auth = new TCell({
      id: 'test-auth',
      secretKey: 'test-secret',
    });

    const result = await auth.createToken({
      userId,
      email: 'test@example.com',
      issuedAt: new Date(),
    });

    return result.token!;
  }
}

// Usage
it('should validate user permissions', async () => {
  const user = await TestFixtures.createUser();
  const token = await TestFixtures.createAuthToken(user.id);

  // Test with fixtures
  const result = await api.request('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(result.user.id).toBe(user.id);
});
```

## Best Practices

### 1. Isolate Tests

```typescript
// Good: Each test is independent
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(); // Fresh instance
  });

  it('test 1', () => {
    // Use service
  });

  it('test 2', () => {
    // Use fresh service
  });
});

// Bad: Shared state between tests
describe('UserService', () => {
  const service = new UserService(); // Shared!

  it('test 1', () => {
    service.createUser({}); // Mutates shared state
  });

  it('test 2', () => {
    // Depends on test 1's state
  });
});
```

### 2. Use Test Doubles

```typescript
// Mock external dependencies
class MockEmailService {
  async send(email: string, subject: string, body: string) {
    // Don't actually send email
    return { success: true };
  }
}

it('should send welcome email', async () => {
  const mockEmail = new MockEmailService();
  const service = new UserService({ emailService: mockEmail });

  await service.register({ email: 'test@example.com' });

  // Verify email service was called (use spy)
  expect(mockEmail.send).toHaveBeenCalledWith('test@example.com', 'Welcome', expect.any(String));
});
```

### 3. Test Error Paths

```typescript
describe('Error Handling', () => {
  it('should handle invalid input', async () => {
    await expect(service.process(null)).rejects.toThrow('Invalid input');
  });

  it('should handle network errors', async () => {
    // Simulate network failure
    mockHttp.simulateError('ECONNREFUSED');

    await expect(service.fetchData()).rejects.toThrow('Connection failed');
  });

  it('should handle timeout', async () => {
    mockHttp.simulateDelay(10000); // 10s delay

    await expect(service.fetchData({ timeout: 1000 })).rejects.toThrow('Timeout');
  });
});
```

### 4. Performance Testing

```typescript
import { PerformanceProfiler } from '@synapse-framework/core';

describe('Performance', () => {
  const profiler = new PerformanceProfiler({ id: 'test-profiler' });

  it('should complete within time budget', async () => {
    const mark = profiler.start('operation');

    await service.heavyOperation();

    const duration = profiler.end(mark);

    expect(duration).toBeLessThan(1000); // 1 second
  });

  it('should handle load', async () => {
    const promises = [];

    // Simulate 100 concurrent requests
    for (let i = 0; i < 100; i++) {
      promises.push(service.process({ id: i }));
    }

    await expect(Promise.all(promises)).resolves.toBeDefined();
  });
});
```

### 5. Use Theater Instruments

```typescript
import { Stage, PerformanceProfiler, SignalTracer, HealthMonitor } from '@synapse-framework/core';

describe('Service Performance', () => {
  const stage = new Stage({ title: 'Performance Tests' });
  const profiler = new PerformanceProfiler({ stage });
  const tracer = new SignalTracer({ stage });
  const healthMonitor = new HealthMonitor({ stage });

  beforeAll(async () => {
    stage.mount('service', myService);
    await stage.start();
  });

  it('should profile execution', async () => {
    profiler.startProfiling();

    await myService.process({ data: 'test' });

    const profile = profiler.getProfile();

    expect(profile.totalTime).toBeLessThan(100);
    expect(profile.callCount).toBe(1);
  });

  it('should trace signals', async () => {
    tracer.startTracing();

    await myService.process({ data: 'test' });

    const trace = tracer.getTrace();

    expect(trace.signals.length).toBeGreaterThan(0);
    expect(trace.signals[0].type).toBe('excitatory');
  });

  it('should monitor health', async () => {
    const health = healthMonitor.check(myService);

    expect(health.healthy).toBe(true);
    expect(health.errors).toBe(0);
  });
});
```

## Coverage Goals

- **Unit Tests**: 80%+ line coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User workflows covered

```bash
# Run with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install
        run: npm ci

      - name: Unit Tests
        run: npm test

      - name: E2E Tests
        run: npm run test:e2e

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

## Next Steps

- **[Architecture](../architecture/design-philosophy.md)** - Understand design decisions
- **[Examples](../examples/README.md)** - See complete examples
- **[API Reference](../api/README.md)** - Detailed API docs
