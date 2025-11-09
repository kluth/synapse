# Circulatory System

The Circulatory System is Synapse's message routing and event handling infrastructure. Just as the circulatory system distributes blood (oxygen, nutrients, hormones) throughout the body, this system distributes messages throughout your application.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Messaging Patterns](#messaging-patterns)
- [Quick Start](#quick-start)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Overview

### The Metaphor

In the human body:
- **Heart** → Pumps blood throughout the system
- **Arteries** → Carry oxygenated blood away from the heart
- **Veins** → Return deoxygenated blood to the heart
- **Blood Cells** → Carry oxygen, nutrients, and messages (hormones)
- **Circulatory Patterns** → Various blood flow patterns for different needs

In Synapse:
- **Heart** → Message broker that routes messages
- **Arteries** → Outbound message channels
- **Veins** → Inbound message channels
- **BloodCells** → Message payloads with metadata
- **Messaging Patterns** → Pub-Sub, Request-Response, Event Sourcing, Saga, Fire-and-Forget

### When to Use

Use the Circulatory System when you need:
- **Event-driven architecture** - Components react to events
- **Decoupled communication** - Components don't know about each other
- **Publish-Subscribe patterns** - One-to-many message distribution
- **Request-Response** - Synchronous RPC-style communication
- **Message routing** - Complex message flows
- **Event sourcing** - Store and replay events
- **Saga orchestration** - Distributed transactions

## Core Components

### Heart - The Message Broker

The Heart is the central message broker that routes messages between components:

```typescript
import { Heart } from '@synapse-framework/core';

const heart = new Heart({
  persistence: true,     // Persist messages
  maxQueueSize: 10000,  // Queue capacity
});

// Subscribe to a topic
const unsubscribe = heart.subscribe('user.created', async (cell) => {
  console.log('New user:', cell.payload);
});

// Publish a message
await heart.publish('user.created', new BloodCell({
  userId: '123',
  email: 'user@example.com'
}));

// Cleanup
unsubscribe();
```

#### Features

- **Topic-based routing** with pattern matching
- **Wildcard subscriptions** (e.g., `user.*`, `*.created`)
- **At-least-once delivery** guarantee
- **Dead letter queue** for failed messages
- **Message persistence** (optional)
- **Priority queues**
- **Statistics tracking**

#### Pattern Matching

```typescript
// Exact match
heart.subscribe('user.created', handler);

// Wildcard - single level
heart.subscribe('user.*', handler);  // Matches user.created, user.updated

// Wildcard - multiple levels
heart.subscribe('*.created', handler);  // Matches user.created, order.created
```

### BloodCell - Message Payload

BloodCells wrap your message data with metadata:

```typescript
import { BloodCell } from '@synapse-framework/core';

const cell = new BloodCell(
  { userId: '123', action: 'login' },  // Payload
  {
    type: 'UserEvent',                 // Message type
    priority: 'high',                  // Priority level
    correlationId: 'req-456',          // For tracking
    metadata: {
      source: 'auth-service',
      timestamp: new Date(),
    }
  }
);

// Access data
console.log(cell.payload);      // { userId: '123', action: 'login' }
console.log(cell.type);         // 'UserEvent'
console.log(cell.priority);     // 'high'
console.log(cell.correlationId);// 'req-456'
```

#### Message Priority

```typescript
// High priority - processed first
const urgent = new BloodCell(data, { priority: 'high' });

// Normal priority
const normal = new BloodCell(data, { priority: 'normal' });

// Low priority - processed when idle
const background = new BloodCell(data, { priority: 'low' });
```

### Artery - Outbound Channel

Arteries send messages out from a component:

```typescript
import { Artery } from '@synapse-framework/core';

const artery = new Artery(heart, {
  source: 'user-service',
  defaultPriority: 'normal',
});

// Send message
await artery.send('user.registered', {
  userId: '123',
  email: 'user@example.com'
});
```

### Vein - Inbound Channel

Veins receive messages into a component:

```typescript
import { Vein } from '@synapse-framework/core';

const vein = new Vein(heart, {
  target: 'email-service',
  topics: ['user.registered', 'user.password-reset'],
});

// Handle incoming messages
vein.onMessage(async (cell) => {
  console.log('Received:', cell.payload);
  // Process message
});
```

## Messaging Patterns

Synapse provides pre-built patterns for common use cases:

### 1. Publish-Subscribe

One-to-many broadcast messaging:

```typescript
import { PublishSubscribe } from '@synapse-framework/core';

const pubsub = new PublishSubscribe(heart);

// Multiple subscribers
pubsub.subscribe('user.created', async (data) => {
  // Send welcome email
  await sendWelcomeEmail(data.email);
});

pubsub.subscribe('user.created', async (data) => {
  // Log analytics
  await trackUserRegistration(data);
});

pubsub.subscribe('user.created', async (data) => {
  // Create user profile
  await createProfile(data);
});

// Single publish reaches all subscribers
await pubsub.publish('user.created', {
  userId: '123',
  email: 'user@example.com'
});
```

**Use for**:
- Event notifications
- Broadcasting updates
- Triggering multiple side effects
- Decoupled components

### 2. Request-Response

Synchronous RPC-style communication:

```typescript
import { RequestResponse } from '@synapse-framework/core';

const rr = new RequestResponse(heart);

// Register handler
rr.handle('user.get', async (request) => {
  const userId = request.payload.userId;
  const user = await database.getUser(userId);
  return user;
});

// Send request and wait for response
const user = await rr.request('user.get', { userId: '123' }, {
  timeout: 5000  // 5 second timeout
});

console.log('Got user:', user);
```

**Use for**:
- API-like calls between services
- Fetching data from another component
- Synchronous workflows
- Remote procedure calls

### 3. Event Sourcing

Store and replay events:

```typescript
import { EventSourcing } from '@synapse-framework/core';

const eventSourcing = new EventSourcing(heart, {
  persistence: true,
  snapshotInterval: 100,  // Snapshot every 100 events
});

// Append events
await eventSourcing.append('user-123', 'UserCreated', {
  email: 'user@example.com'
});

await eventSourcing.append('user-123', 'ProfileUpdated', {
  name: 'John Doe'
});

// Replay events to rebuild state
const state = await eventSourcing.replay('user-123', (state, event) => {
  switch (event.type) {
    case 'UserCreated':
      return { email: event.payload.email };
    case 'ProfileUpdated':
      return { ...state, name: event.payload.name };
    default:
      return state;
  }
});

console.log('Current state:', state);
// { email: 'user@example.com', name: 'John Doe' }
```

**Use for**:
- Audit trails
- Time travel debugging
- CQRS patterns
- Event-driven architecture

### 4. Saga Pattern

Distributed transactions across services:

```typescript
import { Saga } from '@synapse-framework/core';

const saga = new Saga(heart);

// Define saga workflow
saga.define('order-placement', [
  {
    step: 'reserve-inventory',
    action: async (data) => {
      return await inventoryService.reserve(data.items);
    },
    compensation: async (data) => {
      await inventoryService.release(data.items);
    }
  },
  {
    step: 'charge-payment',
    action: async (data) => {
      return await paymentService.charge(data.amount);
    },
    compensation: async (data) => {
      await paymentService.refund(data.amount);
    }
  },
  {
    step: 'create-order',
    action: async (data) => {
      return await orderService.create(data);
    },
    compensation: async (data) => {
      await orderService.cancel(data.orderId);
    }
  }
]);

// Execute saga
try {
  const result = await saga.execute('order-placement', {
    items: [{ id: 'item-1', qty: 2 }],
    amount: 99.99
  });
  console.log('Order placed:', result);
} catch (error) {
  // Compensating transactions automatically executed
  console.error('Saga failed, rolled back:', error);
}
```

**Use for**:
- Distributed transactions
- Multi-step workflows
- Microservices coordination
- Error recovery

### 5. Fire-and-Forget

Asynchronous one-way messages:

```typescript
import { FireAndForget } from '@synapse-framework/core';

const fireAndForget = new FireAndForget(heart);

// Send message without waiting for confirmation
fireAndForget.send('analytics.track', {
  event: 'user.login',
  userId: '123',
  timestamp: new Date()
});

// No waiting, execution continues immediately

// Register handler
fireAndForget.handle('analytics.track', async (data) => {
  await analyticsDatabase.insert(data);
});
```

**Use for**:
- Logging
- Analytics
- Non-critical notifications
- Background tasks

## Quick Start

### Basic Setup

```typescript
import { Heart, PublishSubscribe, RequestResponse } from '@synapse-framework/core';

// 1. Create the Heart
const heart = new Heart({
  persistence: false,
  maxQueueSize: 5000,
});

// 2. Set up Pub-Sub
const pubsub = new PublishSubscribe(heart);

// 3. Subscribe to events
pubsub.subscribe('app.started', async () => {
  console.log('Application started!');
});

// 4. Publish event
await pubsub.publish('app.started', {});

// 5. Set up Request-Response
const rr = new RequestResponse(heart);

// 6. Register handler
rr.handle('greeting.get', async (request) => {
  return { message: `Hello, ${request.payload.name}!` };
});

// 7. Make request
const response = await rr.request('greeting.get', { name: 'Alice' });
console.log(response);  // { message: 'Hello, Alice!' }
```

### Complete Example: User Service

```typescript
import {
  Heart,
  PublishSubscribe,
  RequestResponse,
  EventSourcing,
  BloodCell
} from '@synapse-framework/core';

class UserManagementSystem {
  private heart: Heart;
  private pubsub: PublishSubscribe;
  private rr: RequestResponse;
  private events: EventSourcing;

  constructor() {
    this.heart = new Heart({ persistence: true });
    this.pubsub = new PublishSubscribe(this.heart);
    this.rr = new RequestResponse(this.heart);
    this.events = new EventSourcing(this.heart);

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle user registration
    this.rr.handle('user.register', async (request) => {
      const { email, username } = request.payload;

      // Create user
      const userId = crypto.randomUUID();

      // Store event
      await this.events.append(userId, 'UserRegistered', {
        email,
        username,
        timestamp: new Date()
      });

      // Publish event
      await this.pubsub.publish('user.registered', {
        userId,
        email,
        username
      });

      return { userId, email, username };
    });

    // React to user registration
    this.pubsub.subscribe('user.registered', async (data) => {
      console.log('Sending welcome email to:', data.email);
      // Email logic here
    });

    this.pubsub.subscribe('user.registered', async (data) => {
      console.log('Creating user profile for:', data.userId);
      // Profile creation logic here
    });
  }

  async registerUser(email: string, username: string) {
    return await this.rr.request('user.register', { email, username });
  }

  async getUserHistory(userId: string) {
    return await this.events.getEvents(userId);
  }
}

// Usage
const userSystem = new UserManagementSystem();

const user = await userSystem.registerUser(
  'alice@example.com',
  'alice'
);
console.log('Created user:', user);

const history = await userSystem.getUserHistory(user.userId);
console.log('User history:', history);
```

## Advanced Usage

### Error Handling

```typescript
// Dead letter queue for failed messages
heart.onDeadLetter((cell) => {
  console.error('Message failed after retries:', cell);
  // Log to error tracking service
  errorTracker.log(cell);
});

// Custom error handling in subscribers
pubsub.subscribe('user.created', async (data) => {
  try {
    await sendEmail(data.email);
  } catch (error) {
    // Handle error, maybe retry
    await retryQueue.add(() => sendEmail(data.email));
  }
});
```

### Message Acknowledgment

```typescript
// Manual acknowledgment for at-least-once delivery
heart.onAcknowledge((cell) => {
  console.log('Message successfully processed:', cell.correlationId);
});

// Acknowledge after processing
heart.subscribe('important.task', async (cell) => {
  await processTask(cell.payload);
  heart.acknowledge(cell);  // Confirm receipt
});
```

### Statistics and Monitoring

```typescript
// Get Heart statistics
const stats = heart.getStatistics();
console.log(`Published: ${stats.published}`);
console.log(`Delivered: ${stats.delivered}`);
console.log(`Failed: ${stats.failed}`);
console.log(`Dead lettered: ${stats.deadLettered}`);

// Monitor queue size
setInterval(() => {
  const queueSize = heart.getQueueSize();
  if (queueSize > 1000) {
    console.warn('Queue backlog detected:', queueSize);
  }
}, 5000);
```

## Best Practices

### 1. Use Topic Naming Conventions

```typescript
// Good: Hierarchical, descriptive
'user.registered'
'order.payment.completed'
'inventory.item.reserved'

// Bad: Flat, ambiguous
'userEvent'
'data'
'message'
```

### 2. Idempotent Message Handlers

Messages may be delivered more than once (at-least-once delivery):

```typescript
// Good: Idempotent - safe to run multiple times
pubsub.subscribe('user.created', async (data) => {
  // Check if already processed
  if (await userExists(data.userId)) {
    return;  // Skip duplicate
  }

  await createUser(data);
});

// Bad: Not idempotent
pubsub.subscribe('inventory.decremented', async (data) => {
  // This could decrease inventory multiple times!
  inventory[data.itemId] -= data.quantity;
});
```

### 3. Use Correlation IDs

Track related messages:

```typescript
const correlationId = crypto.randomUUID();

// Send request
await heart.publish('order.create', new BloodCell(orderData, {
  correlationId,
}));

// In handler, use same correlation ID for related messages
heart.subscribe('order.create', async (cell) => {
  const result = await createOrder(cell.payload);

  // Use same correlation ID for response
  await heart.publish('order.created', new BloodCell(result, {
    correlationId: cell.correlationId,
  }));
});
```

### 4. Set Appropriate Timeouts

```typescript
// Quick operations - short timeout
const user = await rr.request('user.get', { id: '123' }, {
  timeout: 2000  // 2 seconds
});

// Complex operations - longer timeout
const report = await rr.request('report.generate', { params }, {
  timeout: 60000  // 1 minute
});
```

### 5. Use Priority Wisely

```typescript
// Critical: System health, errors
await heart.publish('system.error', new BloodCell(error, {
  priority: 'high'
}));

// Normal: Regular operations
await heart.publish('user.login', new BloodCell(data, {
  priority: 'normal'
}));

// Background: Analytics, logging
await heart.publish('analytics.track', new BloodCell(event, {
  priority: 'low'
}));
```

### 6. Clean Up Subscriptions

```typescript
class MyService {
  private unsubscribers: Array<() => void> = [];

  constructor(heart: Heart) {
    // Store unsubscribe functions
    this.unsubscribers.push(
      heart.subscribe('user.*', this.handleUser)
    );
    this.unsubscribers.push(
      heart.subscribe('order.*', this.handleOrder)
    );
  }

  async shutdown() {
    // Clean up all subscriptions
    this.unsubscribers.forEach(unsub => unsub());
  }
}
```

## API Reference

### Heart

```typescript
class Heart {
  constructor(options?: HeartOptions);

  // Publishing
  publish(topic: string, cell: BloodCell, options?: PublishOptions): Promise<void>;

  // Subscribing
  subscribe(topic: string, callback: (cell: BloodCell) => void): () => void;

  // Management
  acknowledge(cell: BloodCell): void;
  getStatistics(): HeartStatistics;
  getQueueSize(): number;

  // Event handlers
  onDeadLetter(handler: (cell: BloodCell) => void): void;
  onAcknowledge(handler: (cell: BloodCell) => void): void;
}
```

### BloodCell

```typescript
class BloodCell<TPayload = unknown> {
  constructor(payload: TPayload, options?: BloodCellOptions);

  readonly payload: TPayload;
  readonly type: string;
  readonly priority: 'low' | 'normal' | 'high';
  readonly correlationId?: string;
  readonly metadata: Record<string, unknown>;
}
```

## Next Steps

- **[Immune System](../immune/README.md)** - Add security to your messages
- **[Nervous System](../nervous/README.md)** - Connect neurons with message flows
- **[Tutorial: Event-Driven Architecture](../../tutorials/event-sourcing/README.md)**

## Troubleshooting

### Messages not being delivered

1. Check topic name matches exactly (case-sensitive)
2. Verify subscriber was registered before publishing
3. Check Heart queue isn't full (`maxQueueSize`)
4. Look for errors in subscriber callbacks

### High memory usage

1. Check `maxQueueSize` setting
2. Monitor dead letter queue growth
3. Ensure subscribers are processing messages fast enough
4. Consider disabling persistence if not needed

### Message ordering issues

Messages are delivered in FIFO order per topic, but:
- Different topics may interleave
- Async processing may complete out of order
- Use correlation IDs to track related messages

For guaranteed ordering, use Event Sourcing pattern.
