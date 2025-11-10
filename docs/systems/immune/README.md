# Immune System

The Immune System protects your application from threats, validates identities, and enforces access control. Just as the human immune system defends against pathogens, this system defends against security threats and unauthorized access.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Quick Start](#quick-start)
- [Authentication (TCell)](#authentication-tcell)
- [Authorization (BCell)](#authorization-bcell)
- [Threat Detection (Antibody)](#threat-detection-antibody)
- [Input Sanitization (Macrophage)](#input-sanitization-macrophage)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)

## Overview

### The Metaphor

In the human immune system:
- **T-Cells** → Identify and authenticate cells (self vs non-self)
- **B-Cells** → Produce antibodies and manage adaptive responses (permissions)
- **Antibodies** → Detect and neutralize specific threats
- **Macrophages** → Engulf and digest foreign particles (sanitize inputs)

In Synapse:
- **TCell** → Authentication (JWT, passwords, API keys, OAuth)
- **BCell** → Authorization (RBAC, permissions, policies)
- **Antibody** → Threat detection (suspicious patterns, attacks)
- **Macrophage** → Input sanitization (XSS, SQL injection, etc.)

### When to Use

- **User authentication** - Login, session management
- **Access control** - Role-based permissions
- **Input validation** - Prevent injection attacks
- **Threat detection** - Identify suspicious behavior
- **API security** - Protect endpoints

## Components

### TCell - Authentication

Handles user identity verification:

```typescript
import { TCell } from '@synapse-framework/core';

const auth = new TCell({
  id: 'authenticator',
  algorithm: 'HS256',           // JWT algorithm
  secretKey: process.env.SECRET,// Secret for signing
  expiresIn: '1h',             // Token expiration
  refreshEnabled: true,         // Allow token refresh
});

await auth.activate();
```

### BCell - Authorization

Manages permissions and roles:

```typescript
import { BCell } from '@synapse-framework/core';

const authz = new BCell({
  id: 'authorizer',
  strictMode: true,  // Deny by default
});

await authz.activate();
```

### Antibody - Threat Detection

Detects security threats:

```typescript
import { Antibody } from '@synapse-framework/core';

const detector = new Antibody({
  id: 'threat-detector',
  sensitivity: 'high',
  learnFromThreats: true,
});

await detector.activate();
```

### Macrophage - Input Sanitization

Cleanses untrusted input:

```typescript
import { Macrophage } from '@synapse-framework/core';

const sanitizer = new Macrophage({
  id: 'input-sanitizer',
  xss: true,                // XSS protection
  sqlInjection: true,       // SQL injection protection
  commandInjection: true,   // Command injection protection
  pathTraversal: true,      // Path traversal protection
});

await sanitizer.activate();
```

## Quick Start

### Complete Security Setup

```typescript
import { TCell, BCell, Antibody, Macrophage } from '@synapse-framework/core';

class SecurityLayer {
  private auth: TCell;
  private authz: BCell;
  private detector: Antibody;
  private sanitizer: Macrophage;

  constructor() {
    this.auth = new TCell({
      id: 'auth',
      algorithm: 'HS256',
      secretKey: process.env.JWT_SECRET!,
      expiresIn: '1h',
    });

    this.authz = new BCell({
      id: 'authz',
      strictMode: true,
    });

    this.detector = new Antibody({
      id: 'detector',
      sensitivity: 'medium',
    });

    this.sanitizer = new Macrophage({
      id: 'sanitizer',
      xss: true,
      sqlInjection: true,
    });
  }

  async initialize() {
    await this.auth.activate();
    await this.authz.activate();
    await this.detector.activate();
    await this.sanitizer.activate();

    // Set up roles and permissions
    this.setupRBAC();
  }

  private setupRBAC() {
    // Create permissions
    this.authz.createPermission({
      id: 'users:read',
      resource: 'users',
      action: 'read',
    });

    this.authz.createPermission({
      id: 'users:write',
      resource: 'users',
      action: 'create',
    });

    // Create roles
    this.authz.createRole({
      id: 'user',
      name: 'User',
      permissions: ['users:read'],
    });

    this.authz.createRole({
      id: 'admin',
      name: 'Administrator',
      permissions: ['users:read', 'users:write'],
    });
  }

  async authenticateUser(username: string, password: string) {
    // 1. Sanitize inputs
    const sanitized = this.sanitizer.sanitize({ username, password });
    if (!sanitized.safe) {
      throw new Error('Invalid input detected');
    }

    // 2. Verify credentials (you'd check against a database)
    // For demo purposes:
    const userId = 'user-123';

    // 3. Create token
    const result = await this.auth.createToken({
      userId,
      username: sanitized.sanitized.username,
      issuedAt: new Date(),
    });

    if (!result.success) {
      throw new Error('Failed to create token');
    }

    return result.token!;
  }

  async authorizeRequest(token: string, resource: string, action: string) {
    // 1. Verify token
    const authResult = await this.auth.verifyToken(token);
    if (!authResult.valid || !authResult.session) {
      throw new Error('Invalid token');
    }

    // 2. Check threat detection
    const threatCheck = this.detector.scan({
      userId: authResult.session.userId,
      resource,
      action,
      timestamp: Date.now(),
    });

    if (!threatCheck.safe) {
      throw new Error(`Threat detected: ${threatCheck.threats[0]?.type}`);
    }

    // 3. Check authorization
    const authzResult = await this.authz.authorize({
      userId: authResult.session.userId,
      resource,
      action,
    });

    if (!authzResult.allowed) {
      throw new Error('Access denied');
    }

    return authResult.session;
  }
}

// Usage
const security = new SecurityLayer();
await security.initialize();

// Authenticate
const token = await security.authenticateUser('alice', 'password123');

// Authorize
const session = await security.authorizeRequest(token, 'users', 'read');
console.log('Authorized:', session);
```

## Authentication (TCell)

### Password-Based Authentication

```typescript
const auth = new TCell({
  id: 'password-auth',
  algorithm: 'HS256',
  secretKey: process.env.SECRET!,
});

// Register user (hash password)
const hashedPassword = await auth.hashPassword('userPassword123');
// Store user with hashedPassword in database

// Login
const isValid = await auth.verifyPassword('userPassword123', hashedPassword);

if (isValid) {
  const result = await auth.createToken({
    userId: 'user-123',
    email: 'user@example.com',
    issuedAt: new Date(),
  });

  console.log('Token:', result.token);
  console.log('Refresh Token:', result.refreshToken);
}
```

### Token Verification

```typescript
// Verify JWT token
const verification = await auth.verifyToken(token);

if (verification.valid && verification.session) {
  console.log('User ID:', verification.session.userId);
  console.log('Token expires:', verification.session.expiresAt);
} else {
  console.log('Invalid token:', verification.error);
}
```

### Token Refresh

```typescript
// Refresh an expiring token
const refreshResult = await auth.refreshToken(refreshToken);

if (refreshResult.success) {
  console.log('New token:', refreshResult.token);
  console.log('New refresh token:', refreshResult.refreshToken);
}
```

### Multi-Factor Authentication

```typescript
const auth = new TCell({
  id: 'mfa-auth',
  mfaEnabled: true,
});

// Generate MFA secret for user
const mfaSetup = await auth.setupMFA('user-123');
console.log('MFA Secret:', mfaSetup.secret);
console.log('QR Code URL:', mfaSetup.qrCode);

// Verify MFA code
const isValid = await auth.verifyMFA('user-123', '123456');
```

## Authorization (BCell)

### Creating Permissions

Permissions are the most granular level of access control. They define specific actions that can be performed on specific resources. By creating granular permissions, you can precisely control what users are allowed to do within your application.

```typescript
// Create granular permissions
authz.createPermission({
  id: 'posts:create',
  resource: 'posts',
  action: 'create',
  description: 'Create new blog posts',
});

authz.createPermission({
  id: 'posts:delete',
  resource: 'posts',
  action: 'delete',
  description: 'Delete blog posts',
});

authz.createPermission({
  id: 'users:admin',
  resource: 'users',
  action: 'admin',
  description: 'Full user management',
});
```

### Creating Roles

Roles are collections of permissions. Instead of assigning individual permissions to each user, you assign roles, which simplifies management and makes your authorization model more scalable. Roles can also inherit permissions from other roles.

```typescript
// Basic role
authz.createRole({
  id: 'author',
  name: 'Author',
  description: 'Can create and edit posts',
  permissions: ['posts:create', 'posts:read', 'posts:update'],
});

// Admin role with inheritance
authz.createRole({
  id: 'admin',
  name: 'Administrator',
  description: 'Full system access',
  permissions: ['users:admin'],
  inheritsFrom: ['author'],  // Inherits author permissions
});
```

### Assigning Roles

Once roles and permissions are defined, you can assign roles to users. A user can have one or more roles, granting them all the permissions associated with those roles.

```typescript
// Assign role to user
authz.assignRole('user-123', 'author');

// Assign multiple roles
authz.assignRole('user-456', 'admin');
authz.assignRole('user-456', 'author');

// Remove role
authz.revokeRole('user-123', 'author');
```

### Checking Authorization

After setting up permissions and roles, you can check if a user is authorized to perform a specific action on a given resource. This is the core of enforcing access control within your application.

```typescript
// Check if user can perform action
const result = await authz.authorize({
  userId: 'user-123',
  resource: 'posts',
  action: 'create',
});

if (result.allowed) {
  console.log('User can create posts');
} else {
  console.log('Access denied:', result.reason);
}
```

### Conditional Permissions

```typescript
// Permission with conditions
authz.createPermission({
  id: 'posts:update:own',
  resource: 'posts',
  action: 'update',
  conditions: [
    {
      field: 'authorId',
      operator: 'equals',
      value: '{{userId}}',  // Matches current user
    }
  ],
});

// Check with context
const result = await authz.authorize({
  userId: 'user-123',
  resource: 'posts',
  action: 'update',
  context: {
    authorId: 'user-123',  // Post's author
  },
});
```

## Threat Detection (Antibody)

### Detecting Threats

```typescript
const detector = new Antibody({
  id: 'detector',
  sensitivity: 'high',
  patterns: [
    'sql-injection',
    'xss',
    'brute-force',
    'rate-limit-violation',
  ],
});

// Scan for threats
const scan = detector.scan({
  userId: 'user-123',
  input: "'; DROP TABLE users; --",
  userAgent: 'Mozilla/5.0...',
  ip: '192.168.1.1',
});

if (!scan.safe) {
  console.log('Threats detected:');
  scan.threats.forEach(threat => {
    console.log(`- ${threat.type}: ${threat.description}`);
    console.log(`  Severity: ${threat.severity}`);
  });
}
```

### Custom Threat Patterns

```typescript
// Register custom threat pattern
detector.registerPattern({
  id: 'custom-pattern',
  type: 'suspicious-behavior',
  severity: 'medium',
  detect: (data: unknown) => {
    // Custom detection logic
    const str = String(data);
    return str.includes('malicious');
  },
  description: 'Custom suspicious pattern detected',
});
```

### Threat Response

```typescript
// Handle detected threats
detector.onThreat((threat) => {
  console.log(`⚠️ Threat detected: ${threat.type}`);

  if (threat.severity === 'critical') {
    // Block user immediately
    blockUser(threat.userId);
  } else if (threat.severity === 'high') {
    // Increase monitoring
    increaseMonitoring(threat.userId);
  }

  // Log to security system
  securityLogger.log(threat);
});
```

## Input Sanitization (Macrophage)

### Sanitizing User Input

```typescript
const sanitizer = new Macrophage({
  id: 'sanitizer',
  xss: true,
  sqlInjection: true,
  commandInjection: true,
  pathTraversal: true,
  htmlEncode: true,
});

// Sanitize input
const result = sanitizer.sanitize({
  name: '<script>alert("xss")</script>',
  email: 'user@example.com',
  query: "'; DROP TABLE users; --",
  path: '../../../etc/passwd',
});

if (result.safe) {
  console.log('Clean input:', result.sanitized);
  // {
  //   comment: '&lt;script&gt;alert("xss")&lt;/script&gt;',
  //   email: 'user@example.com',
  //   query: "'; DROP TABLE users; --",  // SQL injection attempts are often escaped or removed depending on the underlying sanitizer.
  //   path: 'etc/passwd'  // Path traversal attempts are typically removed or neutralized.
  // }
} else {
  console.log('Threats found:', result.threats);
}
```

### Configuration Options

```typescript
// Strict sanitization
const strict = new Macrophage({
  xss: true,
  sqlInjection: true,
  commandInjection: true,
  pathTraversal: true,
  htmlEncode: true,
  stripScripts: true,          // Remove all scripts
  allowedTags: ['p', 'br'],    // Only allow specific HTML tags
  maxLength: 10000,            // Maximum input length. Defaults to 10000.
});

// Lenient sanitization
const lenient = new Macrophage({
  xss: true,
  sqlInjection: false,  // Allow SQL-like strings
  htmlEncode: false,    // Don't encode HTML
});
```

## Complete Example

### Secure API Endpoint

```typescript
import { TCell, BCell, Antibody, Macrophage } from '@synapse-framework/core';

class SecureAPI {
  private auth: TCell;
  private authz: BCell;
  private detector: Antibody;
  private sanitizer: Macrophage;

  constructor() {
    this.auth = new TCell({
      id: 'api-auth',
      algorithm: 'HS256',
      secretKey: process.env.JWT_SECRET!,
      expiresIn: '1h',
    });

    this.authz = new BCell({ id: 'api-authz' });
    this.detector = new Antibody({ id: 'api-detector' });
    this.sanitizer = new Macrophage({
      id: 'api-sanitizer',
      xss: true,
      sqlInjection: true,
    });

    this.setupRoles();
  }

  private setupRoles() {
    // Define permissions
    this.authz.createPermission({
      id: 'api:read',
      resource: 'api',
      action: 'read',
    });

    this.authz.createPermission({
      id: 'api:write',
      resource: 'api',
      action: 'create',
    });

    // Define roles
    this.authz.createRole({
      id: 'user',
      name: 'User',
      permissions: ['api:read'],
    });

    this.authz.createRole({
      id: 'admin',
      name: 'Admin',
      permissions: ['api:read', 'api:write'],
    });
  }

  async handleRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body: unknown
  ) {
    try {
      // 1. Extract token
      const token = headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return { status: 401, error: 'No token provided' };
      }

      // 2. Verify authentication
      const authResult = await this.auth.verifyToken(token);
      if (!authResult.valid) {
        return { status: 401, error: 'Invalid token' };
      }

      const userId = authResult.session!.userId;

      // 3. Check for threats
      const threatScan = this.detector.scan({
        userId,
        method,
        path,
        body,
        ip: headers['x-forwarded-for'] || 'unknown',
      });

      if (!threatScan.safe) {
        return {
          status: 403,
          error: 'Suspicious activity detected',
          threats: threatScan.threats,
        };
      }

      // 4. Sanitize input
      const sanitized = this.sanitizer.sanitize(body);
      if (!sanitized.safe) {
        return {
          status: 400,
          error: 'Invalid input',
          threats: sanitized.threats,
        };
      }

      // 5. Check authorization
      const action = method === 'GET' ? 'read' : 'create';
      const authzResult = await this.authz.authorize({
        userId,
        resource: 'api',
        action,
      });

      if (!authzResult.allowed) {
        return { status: 403, error: 'Access denied' };
      }

      // 6. Process request with sanitized data
      return {
        status: 200,
        data: {
          message: 'Request processed successfully',
          sanitized: sanitized.sanitized,
        },
      };
    } catch (error) {
      return {
        status: 500,
        error: 'Internal server error',
      };
    }
  }
}

// Usage
const api = new SecureAPI();

const response = await api.handleRequest(
  'POST',
  '/api/users',
  {
    authorization: 'Bearer eyJhbGc...',
    'x-forwarded-for': '192.168.1.1',
  },
  {
    name: 'Alice',
    email: 'alice@example.com',
  }
);

console.log(response);
```

## Best Practices

### 1. Defense in Depth

Use multiple layers of security:

```typescript
// Layer 1: Sanitization
const sanitized = sanitizer.sanitize(input);

// Layer 2: Threat detection
const threatScan = detector.scan(sanitized.sanitized);

// Layer 3: Authentication
const authResult = await auth.verifyToken(token);

// Layer 4: Authorization
const authzResult = await authz.authorize(request);

// Layer 5: Business logic validation
const businessResult = validateBusinessRules(data);
```

### 2. Principle of Least Privilege

Grant minimum necessary permissions:

```typescript
// Good: Specific permissions
authz.createRole({
  id: 'editor',
  permissions: ['posts:create', 'posts:update:own'],
});

// Bad: Overly broad permissions
authz.createRole({
  id: 'editor',
  permissions: ['*:*'],  // Full access!
});
```

### 3. Secure Token Storage

```typescript
// Good: Use environment variables
const auth = new TCell({
  secretKey: process.env.JWT_SECRET!,
});

// Bad: Hardcoded secrets
const auth = new TCell({
  secretKey: 'my-secret-key',  // Never do this!
});
```

### 4. Regular Security Audits

```typescript
// Monitor authentication attempts
auth.on('authentication:failed', (event) => {
  console.log(`Failed login: ${event.userId}`);

  // Track failed attempts
  if (failedAttempts[event.userId] > 5) {
    lockAccount(event.userId);
  }
});

// Monitor authorization denials
authz.on('authorization:denied', (event) => {
  console.log(`Access denied: ${event.userId} → ${event.resource}`);
});

// Monitor threats
detector.onThreat((threat) => {
  console.log(`Threat: ${threat.type} from ${threat.userId}`);
});
```

### 5. Input Validation

Always validate before sanitizing:

```typescript
// 1. Type validation
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

const validated = schema.parse(input);

// 2. Sanitization
const sanitized = sanitizer.sanitize(validated);

// 3. Use sanitized data
processSafeData(sanitized.sanitized);
```

## Next Steps

- **[Skeletal System](../skeletal/README.md)** - Schema validation
- **[Respiratory System](../respiratory/README.md)** - API security
- **[Tutorial: Authentication](../../tutorials/authentication/README.md)**

## Troubleshooting

### Token Verification Fails

- Check secret key matches between creation and verification
- Verify token hasn't expired
- Ensure algorithm matches (HS256, RS256, etc.)
- Check for typos in token string

### Authorization Always Denies

- Verify user has been assigned roles
- Check permission IDs match exactly
- Ensure role hierarchy is correct
- Review permission conditions

### Sanitizer Too Strict

- Adjust sanitizer configuration
- Use `allowedTags` for specific HTML tags
- Disable specific protections if needed
- Create custom sanitization rules
