# Synapse Systems Overview

This document provides a quick reference for all systems in the Synapse Framework. For detailed guides, see individual system documentation.

## System Reference Table

| System | Purpose | Key Components | Use When |
|--------|---------|----------------|----------|
| **Nervous** | Core reactive framework | NeuralNode, Connection, Circuit | Always (foundation) |
| **Circulatory** | Message routing | Heart, BloodCell, Patterns | Event-driven architecture |
| **Immune** | Security & validation | TCell, BCell, Macrophage | Authentication, authorization |
| **Skeletal** | Schema validation | Bone, Validators | Type checking, API contracts |
| **Muscular** | Data processing | Muscle, MuscleGroup, MuscleMemory | Business logic, pipelines |
| **Respiratory** | Networking & resilience | Lung, Diaphragm, Adapters | HTTP clients, external APIs |
| **Glial** | State & performance | Astrocyte, Oligodendrocyte | Caching, optimization |
| **UI** | Visual components | VisualNeuron, SensoryNeuron | User interfaces |
| **Visualization** | Charts & graphs | LineChart, BarChart, PieChart | Data visualization |
| **Theater** | Testing & development | Stage, Laboratory, Amphitheater | Component testing, dev tools |

## Quick Start by Use Case

### Building a REST API

```typescript
import {
  // Core
  CorticalNeuron,
  // Immune
  TCell, BCell, Macrophage,
  // Skeletal
  Bone,
  // Respiratory
  Router, Diaphragm,
  // Glial
  Astrocyte,
} from '@synapse-framework/core';

// 1. Define schema
const UserSchema = new Bone('User', z.object({
  email: z.string().email(),
  name: z.string(),
}));

// 2. Set up security
const auth = new TCell({ secretKey: process.env.SECRET });
const authz = new BCell({});
const sanitizer = new Macrophage({ xss: true });

// 3. Create service
class UserService extends CorticalNeuron {
  private cache = new Astrocyte({ id: 'cache' });

  async getUser(id: string) {
    // Check cache
    const cached = this.cache.get(`user:${id}`);
    if (cached) return cached;

    // Fetch from DB
    const user = await db.users.findById(id);

    // Cache result
    this.cache.set(`user:${id}`, user, 60000);
    return user;
  }
}

// 4. Set up routes
const router = new Router({
  id: 'api',
  basePath: '/api',
});

router.get('/users/:id', async (req) => {
  // Authenticate
  const session = await auth.verifyToken(req.headers.authorization);

  // Authorize
  await authz.authorize({
    userId: session.userId,
    resource: 'users',
    action: 'read',
  });

  // Process
  const user = await userService.getUser(req.params.id);
  return { data: user };
});
```

### Event-Driven Microservices

```typescript
import {
  Heart,
  PublishSubscribe,
  EventSourcing,
  CorticalNeuron,
} from '@synapse-framework/core';

// 1. Set up message broker
const heart = new Heart({ persistence: true });
const pubsub = new PublishSubscribe(heart);
const events = new EventSourcing(heart);

// 2. User Service
class UserService extends CorticalNeuron {
  async createUser(data: CreateUserInput) {
    const user = await db.users.create(data);

    // Store event
    await events.append(user.id, 'UserCreated', user);

    // Publish event
    await pubsub.publish('user.created', user);

    return user;
  }
}

// 3. Email Service (separate microservice)
pubsub.subscribe('user.created', async (user) => {
  await sendWelcomeEmail(user.email);
});

// 4. Analytics Service (separate microservice)
pubsub.subscribe('user.created', async (user) => {
  await analytics.track('user_registered', { userId: user.id });
});
```

### Data Processing Pipeline

```typescript
import {
  Muscle,
  MuscleGroup,
  MapMuscle,
  FilterMuscle,
  ReduceMuscle,
} from '@synapse-framework/core';

// 1. Define transformation muscles
const parseCSV = new Muscle('parseCSV', (csv: string) => {
  return csv.split('\n').map(line => line.split(','));
});

const validateRow = new Muscle('validateRow', (row: string[]) => {
  return row.length === 3 && row[0] && row[1] && row[2];
});

const transformRow = new Muscle('transformRow', (row: string[]) => {
  return {
    name: row[0],
    email: row[1],
    age: parseInt(row[2]),
  };
});

// 2. Build pipeline
const pipeline = new MuscleGroup('csv-pipeline', [
  parseCSV,
  new FilterMuscle(validateRow),
  new MapMuscle(transformRow),
]);

// 3. Process data
const csvData = `Alice,alice@example.com,30
Bob,bob@example.com,25
Invalid Row
Charlie,charlie@example.com,35`;

const users = await pipeline.execute(csvData);
console.log(users);
// [
//   { name: 'Alice', email: 'alice@example.com', age: 30 },
//   { name: 'Bob', email: 'bob@example.com', age: 25 },
//   { name: 'Charlie', email: 'charlie@example.com', age: 35 }
// ]
```

### Real-Time Application

```typescript
import {
  Heart,
  PublishSubscribe,
  WebSocketAdapter,
  Astrocyte,
} from '@synapse-framework/core';

// 1. Set up messaging
const heart = new Heart();
const pubsub = new PublishSubscribe(heart);

// 2. Set up WebSocket
const ws = new WebSocketAdapter({
  port: 3000,
  path: '/ws',
});

// 3. Set up presence tracking
const presence = new Astrocyte({
  id: 'presence',
  defaultTTL: 30000, // 30s timeout
});

// 4. Handle connections
ws.onConnection((socket) => {
  const userId = socket.userId;

  // Track presence
  presence.set(`user:${userId}`, {
    online: true,
    lastSeen: Date.now(),
  });

  // Subscribe to user-specific events
  const unsub = pubsub.subscribe(`user.${userId}.*`, (event) => {
    socket.send(JSON.stringify(event));
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    presence.delete(`user:${userId}`);
    unsub();
  });
});

// 5. Broadcast to all users
async function broadcastMessage(message: string) {
  const onlineUsers = presence.getKeysByPattern('user:*');

  onlineUsers.forEach((key) => {
    const userId = key.replace('user:', '');
    pubsub.publish(`user.${userId}.message`, { message });
  });
}
```

## System Integration Patterns

### Pattern 1: Full Stack Application

```
HTTP Request
    ↓
[Router] ← Respiratory System
    ↓
[Macrophage] ← Immune System (Sanitize)
    ↓
[Bone] ← Skeletal System (Validate)
    ↓
[TCell] ← Immune System (Authenticate)
    ↓
[BCell] ← Immune System (Authorize)
    ↓
[CorticalNeuron] ← Nervous System (Business Logic)
    ↓
[Muscle] ← Muscular System (Transform)
    ↓
[Astrocyte] ← Glial System (Cache)
    ↓
[Heart] ← Circulatory System (Events)
    ↓
HTTP Response
```

### Pattern 2: Event-Driven Architecture

```
Event Source
    ↓
[Heart] ← Receive Event
    ↓
    ├→ [Service A] ← Process independently
    ├→ [Service B] ← Process independently
    └→ [Service C] ← Process independently
         ↓
    [EventSourcing] ← Store events
         ↓
    [Astrocyte] ← Update projections
```

### Pattern 3: Data Pipeline

```
Raw Data
    ↓
[Muscle] ← Extract
    ↓
[Muscle] ← Transform
    ↓
[Muscle] ← Validate
    ↓
[MuscleMemory] ← Cache results
    ↓
[Heart] ← Publish completion
    ↓
Clean Data
```

## System Dependencies

```
Core Dependencies:
- Nervous System (foundation for everything)

Common Combinations:
- Immune + Skeletal (security + validation)
- Circulatory + Nervous (messaging + processing)
- Muscular + Glial (processing + caching)
- Respiratory + Immune (HTTP + security)
```

## Performance Characteristics

| System | Overhead | Latency | Throughput |
|--------|----------|---------|------------|
| Nervous | Low | <1ms | Very High |
| Circulatory | Medium | 1-5ms | High |
| Immune | Medium | 2-10ms | Medium |
| Skeletal | Low | <1ms | Very High |
| Muscular | Low | <1ms | Very High |
| Respiratory | High | 10-100ms | Medium |
| Glial | Very Low | <1ms | Very High |

## Memory Footprint

| System | Base Memory | Per Component |
|--------|-------------|---------------|
| Nervous | ~1 MB | ~10 KB |
| Circulatory | ~2 MB | ~5 KB |
| Immune | ~3 MB | ~20 KB |
| Skeletal | ~500 KB | ~2 KB |
| Muscular | ~1 MB | ~5 KB |
| Respiratory | ~5 MB | ~50 KB |
| Glial | ~1 MB | ~30 KB |

## Scaling Considerations

### Horizontal Scaling

- **Nervous**: Distribute neurons across nodes
- **Circulatory**: Use distributed message broker (Redis, RabbitMQ)
- **Glial**: Use distributed cache (Redis, Memcached)
- **Respiratory**: Load balance HTTP clients

### Vertical Scaling

- **Increase** Astrocyte cache size for hot data
- **Increase** Heart queue size for high throughput
- **Increase** Connection pool sizes in Oligodendrocyte

## Testing Strategy

| System | Unit Tests | Integration Tests | E2E Tests |
|--------|-----------|-------------------|-----------|
| Nervous | ✅ Required | ✅ Required | ⚠️ Optional |
| Circulatory | ✅ Required | ✅ Required | ✅ Required |
| Immune | ✅ Required | ✅ Required | ✅ Required |
| Skeletal | ✅ Required | ⚠️ Optional | ❌ Not needed |
| Muscular | ✅ Required | ⚠️ Optional | ❌ Not needed |
| Respiratory | ✅ Required | ✅ Required | ✅ Required |
| Glial | ✅ Required | ✅ Required | ⚠️ Optional |

Use **Theater System** for all component testing needs.

## Next Steps

- **Detailed Guides**: See individual system README files
- **Tutorials**: [Building Complete Applications](../tutorials/README.md)
- **API Reference**: [API Documentation](../api/README.md)
- **Examples**: [Code Examples](../examples/README.md)
