# Synapse Framework

**A Neural-Inspired TypeScript Framework for Building Distributed Systems**

[![CI](https://github.com/kluth/synapse/actions/workflows/ci.yml/badge.svg)](https://github.com/kluth/synapse/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Synapse is a TypeScript framework that brings biological intelligence patterns to distributed software architecture. Inspired by the nervous system's 3 billion years of evolution, it models applications as neural networks where components communicate through type-safe connections, adapt to changing conditions, and self-heal from failures.

## 🧠 Core Concept

Just as the nervous system processes billions of signals with remarkable efficiency and resilience, Synapse provides architectural patterns for building scalable, fault-tolerant distributed systems. The framework models:

- **Neurons** → Microservices/Functions (processing units)
- **Synapses** → Communication channels (type-safe connections)
- **Glial Cells** → Support infrastructure (caching, monitoring, routing)
- **Neural Circuits** → Service orchestration (network topology)
- **Neuroplasticity** → Self-healing and optimization (adaptive resilience)

## 🚀 Current Status (v0.1.0)

**Production-Ready Core Components:**
- ✅ **6,266** lines of TypeScript code
- ✅ **160** passing tests across 11 test suites
- ✅ **100%** strict TypeScript with full type safety
- ✅ Comprehensive CI/CD with GitHub Actions
- ✅ Automated dependency management with Dependabot

## 📦 What's Implemented

### Core Processing Units

#### NeuralNode
Base processing abstraction with biological neuron behavior:
```typescript
import { NeuralNode } from '@synapse-framework/core';

const node = new NeuralNode({
  id: 'user-service',
  threshold: 0.7,  // Activation threshold
});

await node.activate();

// Receive signals (dendrite behavior)
await node.receive({
  id: crypto.randomUUID(),
  sourceId: 'auth-service',
  type: 'excitatory',
  strength: 0.8,
  payload: { userId: '123' },
  timestamp: new Date(),
});

// Check if threshold exceeded
const decision = node.integrate();
if (decision.shouldFire) {
  const result = await node.process(input);
}
```

#### CorticalNeuron (Stateful Services)
For long-running, stateful microservices:
```typescript
import { CorticalNeuron } from '@synapse-framework/core';

const userService = new CorticalNeuron({
  id: 'user-service',
  threshold: 0.5,
});

// Maintains state across processing
const result = await userService.process({
  data: { action: 'login', userId: '123' }
});

// State persists between calls
console.log(userService.getState());  // Access accumulated state
```

#### ReflexNeuron (Serverless Functions)
For event-driven, stateless operations:
```typescript
import { ReflexNeuron } from '@synapse-framework/core';

const imageProcessor = new ReflexNeuron({
  id: 'image-resize',
  threshold: 0.8,
});

// Activates on demand, scales to zero when idle
await imageProcessor.process({
  data: { imageUrl: 'https://...', size: '200x200' }
});

// Automatically deactivates after processing
```

### Connection System

#### Synaptic Connections
Type-safe communication with plasticity:
```typescript
import { Connection } from '@synapse-framework/core';

const connection = new Connection({
  source: sourceNeuron,
  target: targetNeuron,
  weight: 0.8,           // Signal amplification
  type: 'excitatory',    // Activation type
  speed: 'myelinated',   // Fast transmission
});

// Transmit signals
await connection.transmit(signal);

// Connections adapt based on usage (Hebbian learning)
connection.strengthen();  // Increase weight
connection.weaken();      // Decrease weight

// Prune unused connections
if (connection.shouldPrune(threshold)) {
  connection.prune();
}
```

### Glial Cell Support Systems

#### Astrocyte - State Management
LRU cache with TTL and namespace support:
```typescript
import { Astrocyte } from '@synapse-framework/core';

const stateManager = new Astrocyte({
  id: 'state-manager',
  maxSize: 1000,        // Max cached items
  defaultTTL: 300000,   // 5 minutes
});

await stateManager.activate();

// Store with automatic expiration
stateManager.set('user:123', userData, 60000);  // 1 minute TTL

// Retrieve
const user = stateManager.get('user:123');

// Pattern matching
const allUsers = stateManager.getKeysByPattern('user:*');

// Statistics
const stats = stateManager.getStatistics();
console.log(`Hit rate: ${stats.hitRate}%`);
```

#### Oligodendrocyte - Performance Optimization
Connection pooling and resource caching:
```typescript
import { Oligodendrocyte } from '@synapse-framework/core';

const optimizer = new Oligodendrocyte({
  id: 'performance-optimizer',
  maxConnections: 10,
  connectionTTL: 300000,
});

await optimizer.activate();

// Connection pooling
const conn = await optimizer.acquireConnection('db-pool');
// Use connection...
optimizer.releaseConnection('db-pool', conn);

// Resource caching with memoization
const result = await optimizer.cacheResource(
  'expensive-computation',
  async () => performExpensiveOperation(),
  { ttl: 60000 }
);

// Track optimized paths (myelination)
optimizer.trackMyelination('auth-service', 'user-service');
const stats = optimizer.getMyelinationStats();
```

#### Microglia - Health Monitoring
Error tracking and metrics collection:
```typescript
import { Microglia } from '@synapse-framework/core';

const monitor = new Microglia({
  id: 'health-monitor',
  errorThreshold: 10,  // Alert after 10 errors
});

await monitor.activate();

// Error tracking
monitor.recordError('user-service', new Error('Connection failed'));

// Metrics collection
monitor.recordMetric('user-service', 'response_time', 125);

// Health checks
monitor.registerHealthCheck('user-service', async () => {
  // Check if service is healthy
  return service.isHealthy();
});

// Alert handling
monitor.onAlert((alert) => {
  console.log(`🚨 Alert: ${alert.message}`);
  // Send to monitoring system
});

// System health
const health = monitor.getSystemHealth();
console.log(`Healthy entities: ${health.healthyCount}/${health.totalCount}`);
```

#### Ependymal - API Gateway
Request routing and rate limiting:
```typescript
import { Ependymal } from '@synapse-framework/core';

const gateway = new Ependymal({
  id: 'api-gateway',
  rateLimit: { requests: 100, window: 60000 },  // 100 req/min
});

await gateway.activate();

// Route registration
gateway.registerRoute('POST', '/users', async (req) => {
  return { status: 201, data: await createUser(req.data) };
});

// Middleware pipeline
gateway.addMiddleware(async (req, next) => {
  // Authentication, logging, etc.
  console.log(`${req.method} ${req.path}`);
  return next(req);
});

// Handle requests
const response = await gateway.handleRequest({
  method: 'POST',
  path: '/users',
  data: { name: 'Alice' },
  clientId: 'client-123',
});

// Statistics
const stats = gateway.getStatistics();
console.log(`Total requests: ${stats.totalRequests}`);
```

### Network Organization

#### NeuralCircuit
Manage neuron topology and connections:
```typescript
import { NeuralCircuit } from '@synapse-framework/core';

const circuit = new NeuralCircuit({
  id: 'user-management-circuit',
});

// Add neurons
circuit.addNeuron(authService);
circuit.addNeuron(userService);
circuit.addNeuron(emailService);

// Connect neurons
circuit.connect(authService, userService, { weight: 0.9 });
circuit.connect(userService, emailService, { weight: 0.7 });

// Activate entire circuit
await circuit.activateAll();

// Analyze topology
const hasCycles = circuit.hasCycles();
const isFeedForward = circuit.isFeedForward();

// Statistics
const stats = circuit.getStatistics();
console.log(`Neurons: ${stats.neuronCount}, Connections: ${stats.connectionCount}`);
```

### Self-Healing System

#### Neuroplasticity
Adaptive optimization and resilience:
```typescript
import { Neuroplasticity } from '@synapse-framework/core';

const plasticity = new Neuroplasticity({
  pruningThreshold: 0.3,      // Remove weak connections
  trainingIterations: 100,     // Learning cycles
});

// Synaptic pruning - remove weak connections
const pruned = plasticity.pruneWeakConnections(circuit);
console.log(`Pruned ${pruned.length} weak connections`);

// Strengthen frequently used paths
plasticity.trainConnection(connection, 10);  // Simulate 10 uses

// Detect failures and create bypass routes
const failedNeurons = circuit.neurons.filter(n => !n.isHealthy());
const bypasses = plasticity.rewireAroundFailure(circuit, failedNeurons);
console.log(`Created ${bypasses.length} bypass connections`);

// Network health assessment
const health = plasticity.assessNetworkHealth(circuit);
console.log(`Network health: ${(health.healthPercentage * 100).toFixed(1)}%`);
```

### Event System

#### EventBus
Type-safe pub-sub with schema validation:
```typescript
import { EventBus } from '@synapse-framework/core';
import { z } from 'zod';

const eventBus = new EventBus();

// Define event schema
const UserRegisteredSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('user:registered'),
  source: z.string(),
  data: z.object({
    userId: z.string(),
    email: z.string().email(),
  }),
  timestamp: z.date(),
});

// Subscribe with schema validation
eventBus.subscribe(
  'user:registered',
  async (event) => {
    console.log(`New user: ${event.data.email}`);
    await sendWelcomeEmail(event.data.email);
  },
  { schema: UserRegisteredSchema }
);

// Wildcard subscriptions
eventBus.subscribe('user:*', async (event) => {
  // Handle all user events
});

// Emit events
await eventBus.emit('user:registered', {
  id: crypto.randomUUID(),
  type: 'user:registered',
  source: 'user-service',
  data: { userId: '123', email: 'user@example.com' },
  timestamp: new Date(),
});

// One-time listeners
eventBus.once('system:shutdown', async () => {
  await cleanup();
});
```

## 🏗️ Architecture Patterns

### Threshold-Based Activation
Neurons only process when accumulated signals exceed their threshold, providing natural backpressure and preventing unnecessary computation.

### Synaptic Plasticity
Connections strengthen with repeated use (Long-Term Potentiation) and weaken with disuse (Long-Term Depression), optimizing communication patterns over time.

### Hebbian Learning
"Neurons that fire together, wire together" - frequently co-activated components automatically optimize their connections.

### Self-Healing Networks
Failed neurons are automatically routed around using redundant pathways and compensatory mechanisms, similar to brain injury recovery.

## 🧪 Development

### Installation

```bash
npm install
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Building

```bash
npm run build         # TypeScript compilation
npm run type-check    # Type checking only
```

### Code Quality

```bash
npm run lint          # ESLint
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting
```

## 📊 Test Coverage

- **11** test suites covering all major components
- **160** tests ensuring comprehensive behavior validation
- **Test categories:**
  - Core: 29 tests (NeuralNode, Connection)
  - Neurons: 19 tests (Cortical, Reflex)
  - Glial: 86 tests (Astrocyte, Oligodendrocyte, Microglia, Ependymal)
  - Network: 16 tests (NeuralCircuit)
  - Communication: 19 tests (EventBus)
  - Plasticity: 8 tests (Neuroplasticity)

## 🔧 Technology Stack

- **Runtime:** Node.js + Bun support
- **Language:** TypeScript 5.3+ (strict mode)
- **Testing:** Jest with ts-jest
- **Validation:** Zod for runtime schema validation
- **Code Quality:** ESLint + Prettier
- **CI/CD:** GitHub Actions
- **Security:** CodeQL analysis, Dependabot

## 🎯 Use Cases

### Microservices Architecture
Model each service as a neuron with typed synaptic connections, automatic health monitoring, and self-healing capabilities.

### Event-Driven Systems
Use RefexNeurons for serverless functions, CorticalNeurons for stateful services, with EventBus for pub-sub communication.

### Distributed Caching
Leverage Astrocyte's LRU cache with TTL and Oligodendrocyte's connection pooling for multi-level performance optimization.

### API Gateway
Deploy Ependymal as your gateway with built-in rate limiting, request validation, and middleware pipeline support.

### Observability
Microglia provides comprehensive health monitoring, error tracking, and metrics collection out of the box.

## 🗺️ Roadmap

### Planned Features
- [ ] Distributed state synchronization across Astrocytes
- [ ] gRPC/tRPC integration for fast synapses
- [ ] Kafka/RabbitMQ adapters for event synapses
- [ ] Advanced ML-based plasticity algorithms
- [ ] Visual circuit debugger and topology viewer
- [ ] Kubernetes operators for deployment
- [ ] Performance benchmarking suite
- [ ] Real-world example applications

### Current Limitations
- In-memory only (no distributed coordination yet)
- No persistent storage adapters
- No built-in service discovery
- Limited protocol implementations

## 📚 Biological Inspiration

The framework draws from these neurological concepts:

- **Neurons:** Specialized processing units (cortical vs reflex)
- **Synapses:** Chemical/electrical communication with plasticity
- **Glial Cells:** Support infrastructure (90% of brain cells)
  - Astrocytes: Metabolic support and homeostasis
  - Oligodendrocytes: Myelination for speed optimization
  - Microglia: Immune system and health monitoring
  - Ependymal: CSF circulation and waste removal
- **Neural Circuits:** Organized networks with feedback loops
- **Neuroplasticity:** Adaptive rewiring and self-healing
- **CNS/PNS:** Central processing vs edge distribution

## 🤝 Contributing

Contributions welcome! This framework is in active development.

### Development Setup

1. Clone the repository
2. Run `npm install`
3. Make changes with tests
4. Run `npm test` and `npm run lint`
5. Submit a pull request

Git hooks enforce code quality:
- **pre-commit:** Linting, formatting, type checking, tests
- **pre-push:** Full test suite with coverage

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with inspiration from:
- Biological neuroscience and neural networks
- Akka/Orleans actor model patterns
- Modern microservices best practices
- Functional reactive programming concepts

---

**Status:** Active Development | **Version:** 0.1.0 | **TypeScript:** 5.3+ | **Tests:** 160 passing
