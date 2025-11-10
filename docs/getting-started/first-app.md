# Your First Synapse Application

In this tutorial, you'll build a complete reactive application that demonstrates the core concepts of Synapse Framework. We'll create a user management system that shows how different systems work together.

## What You'll Build

A simple user management application with:
- User registration and authentication
- Input validation and sanitization
- State management
- Event-driven communication
- Error handling

By the end, you'll understand:
- How neural nodes process signals
- How systems communicate through messages
- How to validate and secure data
- How to manage application state

## Step 1: Project Setup

If you haven't already, create a new project:

```bash
npx @synapse-framework/create-synapse user-management
cd user-management
```

Or if you're adding to an existing project:

```bash
npm install @synapse-framework/core
```

## Step 2: Understanding the Architecture

Before we code, let's understand what we're building:

```
User Input
    ↓
[SensoryNeuron] ← Captures input
    ↓
[Macrophage] ← Sanitizes input (XSS protection)
    ↓
[Bone] ← Validates schema
    ↓
[TCell] ← Authenticates user
    ↓
[CorticalNeuron] ← Business logic (registration/login)
    ↓
[Astrocyte] ← Stores user state
    ↓
[Heart] ← Broadcasts events
```

This flow demonstrates how Synapse systems work together seamlessly.

## Step 3: Define Data Schemas

First, let's define our data structures using the **Skeletal System**:

Create `src/schemas/user.schema.ts`:

```typescript
import { Bone } from '@synapse-framework/core';
import { z } from 'zod';

/**
 * User registration schema
 */
export const RegisterUserSchema = new Bone(
  'RegisterUser',
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
  })
);

/**
 * Login credentials schema
 */
export const LoginCredentialsSchema = new Bone(
  'LoginCredentials',
  z.object({
    email: z.string().email(),
    password: z.string(),
  })
);

/**
 * User entity schema
 */
export const UserSchema = new Bone(
  'User',
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string(),
    createdAt: z.date(),
    lastLogin: z.date().optional(),
  })
);

// Export TypeScript types
export type RegisterUserInput = z.infer<typeof RegisterUserSchema.schema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema.schema>;
export type User = z.infer<typeof UserSchema.schema>;
```

**What's happening here?**
- We use **Bone** (Skeletal System) to define type-safe schemas
- Schemas validate data at runtime
- We leverage Zod for powerful validation rules
- TypeScript types are automatically inferred

## Step 4: Create the User Service

Now let's create the business logic using a **CorticalNeuron**:

Create `src/services/user.service.ts`:

```typescript
import { CorticalNeuron, Astrocyte } from '@synapse-framework/core';
import type { RegisterUserInput, LoginCredentials, User } from '../schemas/user.schema';
import { randomUUID } from 'crypto';

/**
 * User Service - Handles user registration and authentication
 */
export class UserService extends CorticalNeuron {
  private userStore: Astrocyte;
  private sessionStore: Astrocyte;

  constructor() {
    super({
      id: 'user-service',
      type: 'cortical',
      threshold: 0.5,
    });

    // Initialize state stores
    this.userStore = new Astrocyte({
      id: 'user-store',
      cacheSize: 1000,
      ttl: 3600000, // 1 hour
    });

    this.sessionStore = new Astrocyte({
      id: 'session-store',
      cacheSize: 500,
      ttl: 1800000, // 30 minutes
    });
  }

  /**
   * Activate the service and its dependencies
   */
  public override async activate(): Promise<void> {
    await super.activate();
    await this.userStore.activate();
    await this.sessionStore.activate();
  }

  /**
   * Register a new user
   */
  public async registerUser(input: RegisterUserInput): Promise<User> {
    // Check if user already exists
    const existingUser = this.findUserByEmail(input.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const user: User = {
      id: randomUUID(),
      email: input.email,
      username: input.username,
      createdAt: new Date(),
    };

    // Store user (in production, hash the password!)
    this.userStore.set(`user:${user.id}`, user);
    this.userStore.set(`email:${user.email}`, user.id);

    // In production, you'd also store the hashed password separately
    // For demo purposes, we're skipping password storage

    return user;
  }

  /**
   * Authenticate user and create session
   */
  public async login(credentials: LoginCredentials): Promise<{
    user: User;
    sessionToken: string;
  }> {
    // Find user by email
    const user = this.findUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // In production, verify the password hash
    // For demo, we'll skip password verification

    // Create session
    const sessionToken = randomUUID();
    this.sessionStore.set(`session:${sessionToken}`, {
      userId: user.id,
      email: user.email,
      createdAt: new Date(),
    });

    // Update last login
    user.lastLogin = new Date();
    this.userStore.set(`user:${user.id}`, user);

    return { user, sessionToken };
  }

  /**
   * Validate session token
   */
  public validateSession(token: string): User | null {
    const session = this.sessionStore.get(`session:${token}`);
    if (!session) {
      return null;
    }

    const user = this.userStore.get(`user:${session.userId}`);
    return user || null;
  }

  /**
   * Find user by email
   */
  private findUserByEmail(email: string): User | null {
    const userId = this.userStore.get(`email:${email}`);
    if (!userId) {
      return null;
    }

    return this.userStore.get(`user:${userId}`) || null;
  }

  /**
   * Get service statistics
   */
  public getStats() {
    return {
      totalUsers: this.userStore.getKeysByPattern('user:*').length,
      activeSessions: this.sessionStore.getKeysByPattern('session:*').length,
      userStoreStats: this.userStore.getStatistics(),
      sessionStoreStats: this.sessionStore.getStatistics(),
    };
  }
}
```

**What's happening here?**
- **CorticalNeuron** provides stateful service behavior
- **Astrocyte** manages in-memory state with automatic expiration
- Type-safe operations using our defined schemas
- Clean separation of concerns

## Step 5: Add Security Layer

Let's add input sanitization and authentication:

Create `src/security/security.service.ts`:

```typescript
import { Macrophage, TCell } from '@synapse-framework/core';
import type { Session } from '@synapse-framework/core';

/**
 * Security Service - Input sanitization and authentication
 */
export class SecurityService {
  private sanitizer: Macrophage;
  private authenticator: TCell;

  constructor() {
    this.sanitizer = new Macrophage({
      id: 'input-sanitizer',
      xss: true,
      sqlInjection: true,
      commandInjection: true,
    });

    this.authenticator = new TCell({
      id: 'authenticator',
      algorithm: 'HS256',
      secretKey: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
    });
  }

  /**
   * Activate security components
   */
  public async activate(): Promise<void> {
    await this.sanitizer.activate();
    await this.authenticator.activate();
  }

  /**
   * Sanitize user input
   */
  public sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const result = this.sanitizer.sanitize(input);

    if (!result.safe) {
      throw new Error(`Input validation failed: ${result.threats.join(', ')}`);
    }

    return result.sanitized;
  }

  /**
   * Create authentication token
   */
  public async createToken(userId: string, email: string): Promise<string> {
    const result = await this.authenticator.createToken({
      userId,
      email,
      issuedAt: new Date(),
    });

    if (!result.success || !result.token) {
      throw new Error('Failed to create authentication token');
    }

    return result.token;
  }

  /**
   * Verify authentication token
   */
  public async verifyToken(token: string): Promise<Session> {
    const result = await this.authenticator.verifyToken(token);

    if (!result.valid || !result.session) {
      throw new Error('Invalid or expired token');
    }

    return result.session;
  }
}
```

**What's happening here?**
- **Macrophage** sanitizes input to prevent XSS, SQL injection, etc.
- **TCell** handles authentication with JWT tokens
- Defense-in-depth security approach

## Step 6: Wire Everything Together

Now let's create the main application that connects all components:

Create `src/app.ts`:

```typescript
import { Heart, EventBus } from '@synapse-framework/core';
import { UserService } from './services/user.service';
import { SecurityService } from './security/security.service';
import {
  RegisterUserSchema,
  LoginCredentialsSchema,
  type RegisterUserInput,
  type LoginCredentials,
} from './schemas/user.schema';

/**
 * Main Application
 */
export class UserManagementApp {
  private userService: UserService;
  private securityService: SecurityService;
  private eventBus: EventBus;
  private messageRouter: Heart;

  constructor() {
    this.userService = new UserService();
    this.securityService = new SecurityService();
    this.eventBus = new EventBus();
    this.messageRouter = new Heart();

    this.setupEventHandlers();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    console.log('Starting User Management Application...\n');

    // Activate all services
    await this.userService.activate();
    await this.securityService.activate();

    console.log('✅ All services activated\n');
  }

  /**
   * Setup event handlers for system events
   */
  private setupEventHandlers(): void {
    // Listen for user registration events
    this.eventBus.subscribe('user:registered', async (event) => {
      console.log(`📧 Sending welcome email to ${event.data.email}`);
      // In production, trigger email service
    });

    // Listen for login events
    this.eventBus.subscribe('user:logged-in', async (event) => {
      console.log(`👋 User ${event.data.username} logged in`);
      // In production, log analytics event
    });
  }

  /**
   * Register a new user
   */
  public async registerUser(input: unknown): Promise<{
    success: boolean;
    user?: { id: string; email: string; username: string };
    token?: string;
    error?: string;
  }> {
    try {
      // Step 1: Sanitize input
      const sanitized = this.securityService.sanitizeInput(input as Record<string, unknown>);

      // Step 2: Validate schema
      const validatedInput = RegisterUserSchema.validate(sanitized) as RegisterUserInput;

      // Step 3: Register user
      const user = await this.userService.registerUser(validatedInput);

      // Step 4: Create authentication token
      const token = await this.securityService.createToken(user.id, user.email);

      // Step 5: Emit event
      await this.eventBus.emit('user:registered', {
        id: crypto.randomUUID(),
        type: 'user:registered',
        source: 'user-service',
        data: user,
        timestamp: new Date(),
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Login user
   */
  public async login(input: unknown): Promise<{
    success: boolean;
    user?: { id: string; email: string; username: string };
    token?: string;
    error?: string;
  }> {
    try {
      // Step 1: Sanitize input
      const sanitized = this.securityService.sanitizeInput(input as Record<string, unknown>);

      // Step 2: Validate schema
      const credentials = LoginCredentialsSchema.validate(sanitized) as LoginCredentials;

      // Step 3: Authenticate
      const { user } = await this.userService.login(credentials);

      // Step 4: Create token
      const token = await this.securityService.createToken(user.id, user.email);

      // Step 5: Emit event
      await this.eventBus.emit('user:logged-in', {
        id: crypto.randomUUID(),
        type: 'user:logged-in',
        source: 'user-service',
        data: user,
        timestamp: new Date(),
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Get application statistics
   */
  public getStats() {
    return {
      userService: this.userService.getStats(),
      health: this.userService.healthCheck(),
    };
  }

  /**
   * Shutdown the application
   */
  public async shutdown(): Promise<void> {
    await this.userService.deactivate();
    console.log('Application shut down');
  }
}
```

**What's happening here?**
- Orchestrates all services together
- Implements complete request flow: sanitize → validate → process → respond
- Event-driven architecture with EventBus
- Clean error handling
- Type safety throughout

## Step 7: Create the Entry Point

Create `src/index.ts`:

```typescript
import { UserManagementApp } from './app';

async function main() {
  const app = new UserManagementApp();

  try {
    // Initialize the application
    await app.initialize();

    console.log('='.repeat(60));
    console.log('USER MANAGEMENT DEMO');
    console.log('='.repeat(60) + '\n');

    // Demo: Register a new user
    console.log('📝 Registering new user...');
    const registerResult = await app.registerUser({
      email: 'alice@example.com',
      password: 'SecurePass123!',
      username: 'alice',
    });

    if (registerResult.success) {
      console.log('✅ Registration successful!');
      console.log(`   User ID: ${registerResult.user?.id}`);
      console.log(`   Token: ${registerResult.token?.substring(0, 20)}...\n`);
    } else {
      console.log(`❌ Registration failed: ${registerResult.error}\n`);
    }

    // Demo: Login
    console.log('🔐 Logging in...');
    const loginResult = await app.login({
      email: 'alice@example.com',
      password: 'SecurePass123!',
    });

    if (loginResult.success) {
      console.log('✅ Login successful!');
      console.log(`   Welcome back, ${loginResult.user?.username}!`);
      console.log(`   Token: ${loginResult.token?.substring(0, 20)}...\n`);
    } else {
      console.log(`❌ Login failed: ${loginResult.error}\n`);
    }

    // Demo: Try to register duplicate user
    console.log('📝 Attempting duplicate registration...');
    const duplicateResult = await app.registerUser({
      email: 'alice@example.com',
      password: 'AnotherPass456!',
      username: 'alice2',
    });

    if (duplicateResult.success) {
      console.log('✅ Unexpected success\n');
    } else {
      console.log(`✅ Correctly rejected: ${duplicateResult.error}\n`);
    }

    // Show statistics
    console.log('='.repeat(60));
    console.log('STATISTICS');
    console.log('='.repeat(60));
    const stats = app.getStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Shutdown
    await app.shutdown();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
```

## Step 8: Run Your Application

Now run your first Synapse application:

```bash
# Install dependencies (if not already done)
npm install

# Run with ts-node
npx ts-node src/index.ts

# Or build and run
npm run build
node dist/index.js

# Or use Bun (fastest)
bun run src/index.ts
```

You should see output like:

```
Starting User Management Application...

✅ All services activated

============================================================
USER MANAGEMENT DEMO
============================================================

📝 Registering new user...
📧 Sending welcome email to alice@example.com
✅ Registration successful!
   User ID: 550e8400-e29b-41d4-a716-446655440000
   Token: eyJhbGciOiJIUzI1NiIs...

🔐 Logging in...
👋 User alice logged in
✅ Login successful!
   Welcome back, alice!
   Token: eyJhbGciOiJIUzI1NiIs...

📝 Attempting duplicate registration...
✅ Correctly rejected: User already exists

============================================================
STATISTICS
============================================================
{
  "userService": {
    "totalUsers": 1,
    "activeSessions": 2,
    ...
  }
}
============================================================

Application shut down
```

## Understanding What You Built

Congratulations! You've created a complete application using multiple Synapse systems:

1. **Skeletal System (Bone)** - Schema validation
2. **Immune System (Macrophage, TCell)** - Security and authentication
3. **Nervous System (CorticalNeuron)** - Business logic
4. **Glial System (Astrocyte)** - State management
5. **Communication (EventBus)** - Event-driven architecture

### Key Concepts Demonstrated

1. **Type Safety** - TypeScript types flow through the entire stack
2. **Validation Layers** - Input sanitization, schema validation, business rules
3. **State Management** - Automatic TTL, LRU caching with Astrocyte
4. **Event-Driven** - Loose coupling through events
5. **Lifecycle Management** - Proper activation/deactivation

## Next Steps

Now that you've built your first application, explore:

1. **[Add Authorization](../../tutorials/authentication/README.md)** - Role-based access control with BCell
2. **[Add API Endpoints](../systems/respiratory/README.md)** - Expose via HTTP using the Respiratory System
3. **[Add Persistence](../../tutorials/todo-app/README.md)** - Use external storage
4. **[Add Tests](../testing/unit-testing.md)** - Write comprehensive tests

## Exercise: Extend the Application

Try adding these features on your own:

1. **Password Reset** - Add a password reset flow
2. **User Profiles** - Allow users to update their profile
3. **Role-Based Access** - Add admin vs regular user roles
4. **Rate Limiting** - Prevent brute force attacks
5. **Email Verification** - Verify email addresses before activation

## Troubleshooting

### Common Issues

**Issue**: "User already exists" on first run
- Clear the Astrocyte cache or restart the application

**Issue**: Type errors with schemas
- Ensure you're using `z.infer<>` to extract TypeScript types
- Check that zod version is 4.0+

**Issue**: Token validation fails
- Verify JWT_SECRET is set consistently
- Check token hasn't expired

## Summary

You've learned:
- How to structure a Synapse application
- How different systems work together
- How to implement secure user management
- How to use type-safe schemas
- How to manage state and events

This foundation prepares you for building larger, more complex applications with Synapse!
