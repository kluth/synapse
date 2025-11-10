# Synapse Framework - API Reference

Complete API reference for all major components and systems.

## Table of Contents

- [Core Components](#core-components)
- [Nervous System](#nervous-system)
- [Circulatory System](#circulatory-system)
- [Immune System](#immune-system)
- [Skeletal System](#skeletal-system)
- [Muscular System](#muscular-system)
- [Respiratory System](#respiratory-system)
- [Glial System](#glial-system)
- [Theater System](#theater-system)
- [Types](#types)

## Core Components

### NeuralNode

Base class for all processing units.

```typescript
class NeuralNode implements INeuralNode {
  constructor(config: NeuralNodeConfig)

  // Lifecycle
  activate(): Promise<void>
  deactivate(): Promise<void>
  getStatus(): NodeState
  healthCheck(): HealthStatus

  // Signal Processing
  receive(signal: Signal): Promise<void>
  integrate(): Decision
  process(input: Input): Promise<Output>
  transmit(signal: Signal): Promise<void>

  // Properties
  readonly id: string
  readonly type: NeuronType
  state: NodeState
  threshold: number
}
```

**Config**:
```typescript
interface NeuralNodeConfig {
  id: string - Unique identifier for the neural node.
  type: NeuronType - The type of neuron ('cortical' | 'reflex' | 'sensory' | 'motor').
  threshold: number - Activation threshold (0.0 - 1.0) for the neural node.
}
```

**Methods**:

#### `activate(): Promise<void>`
Activates the node and prepares it for processing.

```typescript
const node = new NeuralNode({ id: 'node-1', type: 'cortical', threshold: 0.5 });
await node.activate();
console.log(node.getStatus());  // 'active'
```

#### `receive(signal: Signal): Promise<void>`
Receives an input signal (dendrite behavior).

```typescript
await node.receive({
  id: crypto.randomUUID(),
  sourceId: 'source-node',
  type: 'excitatory',
  strength: 0.8,
  payload: { data: 'process me' },
  timestamp: new Date(),
});
```

#### `integrate(): Decision`
Integrates received signals to determine if threshold is exceeded.

```typescript
const decision = node.integrate();
if (decision.shouldFire) {
  console.log('Threshold exceeded, processing...');
  const result = await node.process(decision.accumulatedSignal);
}
```

#### `process(input: Input): Promise<Output>`
Processes input when threshold is exceeded. Override in subclasses.

```typescript
class MyNode extends NeuralNode {
  async process(input: Input): Promise<Output> {
    // Custom processing logic
    return { data: input.data.toUpperCase() };
  }
}
```

### Connection

Represents a synaptic connection between neurons.

```typescript
class Connection implements IConnection {
  constructor(config: ConnectionConfig)

  // Transmission
  transmit(signal: Signal): Promise<void>

  // Plasticity
  strengthen(): void
  weaken(): void
  shouldPrune(threshold: number): boolean

  // Properties
  readonly source: INeuralNode
  readonly target: INeuralNode
  weight: number
  type: ConnectionType
  speed: TransmissionSpeed
}
```

**Config**:
```typescript
interface ConnectionConfig {
  source: INeuralNode - The source neural node of the connection.
  target: INeuralNode - The target neural node of the connection.
  weight: number - Signal amplification (0.0 - 1.0) for the connection.
  type: ConnectionType - The type of connection ('excitatory' | 'inhibitory' | 'modulatory').
  speed: TransmissionSpeed - The transmission speed of the connection ('myelinated' | 'unmyelinated').
}
```

**Example**:
```typescript
const connection = new Connection({
  source: nodeA,
  target: nodeB,
  weight: 0.8,
  type: 'excitatory',
  speed: 'myelinated',
});

await connection.transmit({
  id: crypto.randomUUID(),
  sourceId: nodeA.id,
  type: 'excitatory',
  strength: 0.9,
  payload: { data: 'hello' },
  timestamp: new Date(),
});
```

## Nervous System

### CorticalNeuron

Stateful service neuron.

```typescript
class CorticalNeuron extends NeuralNode {
  constructor(config: NeuralNodeConfig)

  // State Management
  getState(): Record<string, unknown>
  setState(state: Record<string, unknown>): void

  // Override to implement business logic
  process(input: Input): Promise<Output>
}
```

**Example**:
```typescript
class UserService extends CorticalNeuron {
  private users: Map<string, User> = new Map();

  constructor() {
    super({ id: 'user-service', type: 'cortical', threshold: 0.5 });
  }

  async process(input: Input): Promise<Output> {
    const { action, userId, data } = input.data;

    switch (action) {
      case 'create':
        const user = { id: userId, ...data };
        this.users.set(userId, user);
        return { data: user };

      case 'get':
        const found = this.users.get(userId);
        return { data: found };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  getState() {
    return { userCount: this.users.size };
  }
}
```

### ReflexNeuron

Stateless function neuron.

```typescript
class ReflexNeuron extends NeuralNode {
  constructor(config: NeuralNodeConfig)

  // Override to implement fast, stateless logic
  process(input: Input): Promise<Output>
}
```

**Example**:
```typescript
class ImageResizer extends ReflexNeuron {
  constructor() {
    super({ id: 'image-resizer', type: 'reflex', threshold: 0.8 });
  }

  async process(input: Input): Promise<Output> {
    const { imageUrl, width, height } = input.data;
    const resized = await resizeImage(imageUrl, width, height);
    return { data: resized };
  }
}
```

### NeuralCircuit

Manages topology of connected neurons.

```typescript
class NeuralCircuit {
  constructor(config: CircuitConfig)

  // Neuron Management
  addNeuron(neuron: INeuralNode): void
  removeNeuron(id: string): void
  getNeuron(id: string): INeuralNode | undefined

  // Connection Management
  connect(source: INeuralNode, target: INeuralNode, options?: ConnectionOptions): void
  disconnect(sourceId: string, targetId: string): void

  // Lifecycle
  activateAll(): Promise<void>
  deactivateAll(): Promise<void>

  // Analysis
  hasCycles(): boolean
  isFeedForward(): boolean
  getStatistics(): CircuitStatistics
}
```

**Example**:
```typescript
const circuit = new NeuralCircuit({ id: 'auth-circuit' });

// Add neurons
circuit.addNeuron(apiInput);
circuit.addNeuron(validator);
circuit.addNeuron(authenticator);

// Connect them
circuit.connect(apiInput, validator);
circuit.connect(validator, authenticator);

// Activate all at once
await circuit.activateAll();
```

## Circulatory System

### Heart

Central message broker.

```typescript
class Heart extends EventEmitter {
  constructor(options?: HeartOptions)

  // Publishing
  publish(topic: string, cell: BloodCell, options?: PublishOptions): Promise<void>

  // Subscribing
  subscribe(topic: string, callback: (cell: BloodCell) => void | Promise<void>): () => void

  // Acknowledgment
  acknowledge(cell: BloodCell): void

  // Event Handlers
  onDeadLetter(handler: (cell: BloodCell) => void): void
  onAcknowledge(handler: (cell: BloodCell) => void): void

  // Statistics
  getStatistics(): HeartStatistics
  getQueueSize(): number
}
```

**Options**:
```typescript
interface HeartOptions {
  persistence?: boolean - Whether to persist messages (optional).
  maxQueueSize?: number - The maximum capacity of the message queue (optional).
}
```

**Example**:
```typescript
const heart = new Heart({ persistence: true, maxQueueSize: 10000 });

// Subscribe
const unsubscribe = heart.subscribe('user.*', async (cell) => {
  console.log('User event:', cell.payload);
});

// Publish
await heart.publish('user.created', new BloodCell({
  userId: '123',
  email: 'user@example.com',
}));

// Cleanup
unsubscribe();
```

### BloodCell

Message payload wrapper.

```typescript
class BloodCell<TPayload = unknown> {
  constructor(payload: TPayload, options?: BloodCellOptions)

  readonly payload: TPayload
  readonly type: string
  readonly priority: 'low' | 'normal' | 'high'
  readonly correlationId?: string
  readonly metadata: Record<string, unknown>
}
```

**Example**:
```typescript
const cell = new BloodCell(
  { userId: '123', action: 'login' },
  {
    type: 'UserEvent',
    priority: 'high',
    correlationId: 'req-456',
    metadata: { source: 'auth-service' },
  }
);
```

### PublishSubscribe

Pub-Sub messaging pattern.

```typescript
class PublishSubscribe {
  constructor(heart: Heart)

  publish<TData>(topic: string, data: TData): Promise<void>
  subscribe<TData>(topic: string, callback: (data: TData) => void | Promise<void>): () => void
}
```

**Example**:
```typescript
const pubsub = new PublishSubscribe(heart);

pubsub.subscribe('user.created', async (user) => {
  await sendWelcomeEmail(user.email);
});

await pubsub.publish('user.created', {
  userId: '123',
  email: 'user@example.com',
});
```

### RequestResponse

RPC-style messaging.

```typescript
class RequestResponse {
  constructor(heart: Heart)

  request<TPayload, TResponse>(
    handler: string,
    payload: TPayload,
    options?: RequestOptions
  ): Promise<TResponse>

  handle<TResponse>(
    handler: string,
    callback: (request: BloodCell) => Promise<TResponse> | TResponse
  ): void
}
```

**Example**:
```typescript
const rr = new RequestResponse(heart);

// Register handler
rr.handle('user.get', async (request) => {
  const user = await db.users.findById(request.payload.userId);
  return user;
});

// Make request
const user = await rr.request('user.get', { userId: '123' }, {
  timeout: 5000,
});
```

## Immune System

### TCell

Authentication system.

```typescript
class TCell extends EventEmitter {
  constructor(config: TCellConfig)

  // Activation
  activate(): Promise<void>
  deactivate(): Promise<void>

  // Token Management
  createToken(payload: Record<string, unknown>): Promise<AuthenticationResult>
  verifyToken(token: string): Promise<VerificationResult>
  refreshToken(refreshToken: string): Promise<AuthenticationResult>

  // Password Management
  hashPassword(password: string): Promise<string>
  verifyPassword(password: string, hash: string): Promise<boolean>

  // MFA
  setupMFA(userId: string): Promise<MFASetup>
  verifyMFA(userId: string, code: string): Promise<boolean>
}
```

**Config**:
```typescript
interface TCellConfig {
  id: string - Unique identifier for the TCell instance.
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' - The JWT signing algorithm to use.
  secretKey: string - The secret key used for signing JWTs.
  expiresIn?: string - Token expiration time (e.g., '1h', '7d') (optional).
  refreshEnabled?: boolean - Whether token refresh is enabled (optional).
  mfaEnabled?: boolean - Whether Multi-Factor Authentication is enabled (optional).
}
```

**Example**:
```typescript
const auth = new TCell({
  id: 'authenticator',
  algorithm: 'HS256',
  secretKey: process.env.JWT_SECRET!,
  expiresIn: '1h',
  refreshEnabled: true,
});

await auth.activate();

// Create token
const result = await auth.createToken({
  userId: '123',
  email: 'user@example.com',
  issuedAt: new Date(),
});

console.log('Token:', result.token);

// Verify token
const verification = await auth.verifyToken(result.token!);
if (verification.valid) {
  console.log('User ID:', verification.session.userId);
}
```

### BCell

Authorization system (RBAC).

```typescript
class BCell extends EventEmitter {
  constructor(config: BCellConfig)

  // Activation
  activate(): Promise<void>
  deactivate(): Promise<void>

  // Permission Management
  createPermission(permission: Permission): void
  deletePermission(id: string): void
  getPermission(id: string): Permission | undefined

  // Role Management
  createRole(role: Role): void
  deleteRole(id: string): void
  getRole(id: string): Role | undefined

  // Assignment
  assignRole(userId: string, roleId: string): void
  revokeRole(userId: string, roleId: string): void

  // Authorization
  authorize(request: AuthorizationRequest): Promise<AuthorizationResult>
  hasPermission(userId: string, permissionId: string): boolean
}
```

**Example**:
```typescript
const authz = new BCell({ id: 'authorizer', strictMode: true });

// Create permissions
authz.createPermission({
  id: 'users:read',
  resource: 'users',
  action: 'read',
});

authz.createPermission({
  id: 'users:write',
  resource: 'users',
  action: 'create',
});

// Create role
authz.createRole({
  id: 'admin',
  name: 'Administrator',
  permissions: ['users:read', 'users:write'],
});

// Assign role
authz.assignRole('user-123', 'admin');

// Check authorization
const result = await authz.authorize({
  userId: 'user-123',
  resource: 'users',
  action: 'create',
});

console.log('Allowed:', result.allowed);
```

### Macrophage

Input sanitization.

```typescript
class Macrophage extends EventEmitter {
  constructor(config: MacrophageConfig)

  // Activation
  activate(): Promise<void>
  deactivate(): Promise<void>

  // Sanitization
  sanitize(input: unknown): SanitizationResult
}
```

**Config**:
```typescript
interface MacrophageConfig {
  id: string - Unique identifier for the Macrophage instance.
  xss?: boolean - Enable XSS (Cross-Site Scripting) protection (optional).
  sqlInjection?: boolean - Enable SQL injection protection (optional).
  commandInjection?: boolean - Enable command injection protection (optional).
  pathTraversal?: boolean - Enable path traversal protection (optional).
  htmlEncode?: boolean - Enable HTML encoding for output (optional).
  stripScripts?: boolean - Remove all script tags from input (optional).
  allowedTags?: string[] - List of allowed HTML tags (optional).
  maxLength?: number - Maximum allowed input length (optional).
}
```

**Example**:
```typescript
const sanitizer = new Macrophage({
  id: 'sanitizer',
  xss: true,
  sqlInjection: true,
  htmlEncode: true,
});

const result = sanitizer.sanitize({
  comment: '<script>alert("xss")</script>Hello',
  query: "'; DROP TABLE users; --",
});

console.log('Safe:', result.safe);
console.log('Sanitized:', result.sanitized);
console.log('Threats:', result.threats);
```

## Skeletal System

### Bone

Schema definition and validation.

```typescript
class Bone {
  constructor(name: string, schema: z.ZodSchema)

  // Validation
  validate(data: unknown): unknown
  safeParse(data: unknown): z.SafeParseReturnType<unknown, unknown>

  // Properties
  readonly name: string
  readonly schema: z.ZodSchema
}
```

**Example**:
```typescript
const UserSchema = new Bone('User', z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(0).max(150),
}));

// Validate
try {
  const validated = UserSchema.validate({
    id: crypto.randomUUID(),
    email: 'user@example.com',
    age: 30,
  });
  console.log('Valid:', validated);
} catch (error) {
  console.error('Validation failed:', error);
}

// Safe parse
const result = UserSchema.safeParse({ invalid: 'data' });
if (result.success) {
  console.log('Data:', result.data);
} else {
  console.log('Errors:', result.error);
}

// Type inference
type User = z.infer<typeof UserSchema.schema>;
```

## Muscular System

### Muscle

Pure function wrapper.

```typescript
class Muscle<TInput, TOutput> {
  constructor(
    name: string,
    fn: (...args: TInput[]) => TOutput | Promise<TOutput>,
    options?: MuscleOptions
  )

  // Execution
  execute(...args: TInput[]): TOutput
  executeAsync(...args: TInput[]): Promise<TOutput>

  // Properties
  readonly name: string
  readonly metadata: MuscleMetadata
}
```

**Options**:
```typescript
interface MuscleOptions {
  inputSchema?: Bone - Schema for validating inputs (optional).
  outputSchema?: Bone - Schema for validating outputs (optional).
  deterministic?: boolean - Enable memoization for deterministic functions (optional).
  retry?: RetryPolicy - Configuration for retrying function execution (optional).
  metadata?: MuscleMetadata - Additional metadata for the muscle (optional).
}
```

**Example**:
```typescript
const toUpperCase = new Muscle(
  'toUpperCase',
  (str: string) => str.toUpperCase(),
  {
    deterministic: true,  // Memoize results
    inputSchema: new Bone('String', z.string()),
  }
);

const result = toUpperCase.execute('hello');
console.log(result);  // 'HELLO'
```

### MuscleGroup

Function pipeline.

```typescript
class MuscleGroup<TInput, TOutput> {
  constructor(name: string, muscles: Muscle[])

  // Execution
  execute(input: TInput): Promise<TOutput>

  // Properties
  readonly name: string
  readonly muscles: Muscle[]
}
```

**Example**:
```typescript
const pipeline = new MuscleGroup('data-pipeline', [
  new Muscle('parse', (csv) => csv.split('\n')),
  new Muscle('filter', (lines) => lines.filter(line => line.length > 0)),
  new Muscle('map', (lines) => lines.map(line => line.toUpperCase())),
]);

const result = await pipeline.execute('hello\nworld\n\n');
console.log(result);  // ['HELLO', 'WORLD']
```

## Glial System

### Astrocyte

In-memory state management.

```typescript
class Astrocyte extends EventEmitter {
  constructor(config: AstrocyteConfig)

  // Activation
  activate(): Promise<void>
  deactivate(): Promise<void>

  // State Management
  set(key: string, value: unknown, ttl?: number): void
  get(key: string): unknown
  delete(key: string): boolean
  has(key: string): boolean
  clear(): void

  // Pattern Matching
  getKeysByPattern(pattern: string): string[]

  // Statistics
  getStatistics(): AstrocyteStatistics
}
```

**Config**:
```typescript
interface AstrocyteConfig {
  id: string - Unique identifier for the Astrocyte instance.
  maxSize?: number - Maximum number of items to store (for LRU eviction) (optional).
  defaultTTL?: number - Default Time-To-Live in milliseconds for cached items (optional).
}
```

**Example**:
```typescript
const cache = new Astrocyte({
  id: 'cache',
  maxSize: 1000,
  defaultTTL: 300000,  // 5 minutes
});

await cache.activate();

// Set with TTL
cache.set('user:123', { name: 'Alice' }, 60000);  // 1 minute

// Get
const user = cache.get('user:123');
console.log(user);  // { name: 'Alice' }

// Pattern matching
cache.set('user:1', {});
cache.set('user:2', {});
const userKeys = cache.getKeysByPattern('user:*');
console.log(userKeys);  // ['user:1', 'user:2']

// Statistics
const stats = cache.getStatistics();
console.log(`Hit rate: ${stats.hitRate}%`);
```

## Theater System

### Stage

Test runner and component mounting.

```typescript
class Stage extends EventEmitter {
  constructor(config: StageConfig)

  // Lifecycle
  start(): Promise<void>
  stop(): Promise<void>
  getState(): string

  // Component Management
  mount(element: HTMLElement, id?: string): Promise<void>
  unmount(): Promise<void>
  getMountedComponent(): MountedComponent | null

  // Events
  on(event: string, handler: (...args: unknown[]) => void): this
}
```

**Methods**:

#### `mount(element: HTMLElement, id?: string): Promise<void>`
Mounts an HTML element (component) onto the Stage for rendering and observation. If a component is already mounted, it will be unmounted first. The `id` is optional and defaults to 'component'. This method handles the rendering based on the configured `isolation` mode (iframe, shadow-dom, or none).

```typescript
const stage = new Stage({ title: 'My Tests', darkMode: false });
await stage.initialize(document.getElementById('stage-container')!);

const myComponentElement = document.createElement('div');
myComponentElement.textContent = 'Hello from my component!';

await stage.mount(myComponentElement, 'my-component-id');

const mounted = stage.getMountedComponent();
console.log('Mounted component ID:', mounted?.id);
```

#### `unmount(): Promise<void>`
Unmounts the currently active component from the Stage and clears its container. This method ensures that the DOM is cleaned up and resources are released.

```typescript
await stage.unmount();
console.log('Component unmounted. Has mounted component:', stage.hasMountedComponent());
```

### Laboratory

Test orchestration.

```typescript
class Laboratory extends EventEmitter {
  constructor(config: LaboratoryConfig)

  // Experiments (tests)
  experiment(name: string, fn: () => Promise<void> | void): void

  // Execution
  runAll(): Promise<LabResults>
  run(name: string): Promise<ExperimentResult>

  // Statistics
  getStats(): LabStatistics
}
```

**Example**:
```typescript
const lab = new Laboratory({ stage, verbose: true });

lab.experiment('should work', async () => {
  const result = await component.process({ data: 'test' });
  Hypothesis.expect(result.success).toBe(true);
});

lab.experiment('should handle errors', async () => {
  await Hypothesis.expectAsync(
    component.process(null)
  ).toReject();
});

const results = await lab.runAll();
console.log(`Passed: ${results.passed}/${results.total}`);
```

### Hypothesis

Assertions.

```typescript
class Hypothesis {
  static expect(actual: unknown): ExpectChain
  static expectAsync(promise: Promise<unknown>): AsyncExpectChain
}
```

**Example**:
```typescript
// Synchronous
Hypothesis.expect(5).toBe(5);
Hypothesis.expect('hello').toEqual('hello');
Hypothesis.expect([1, 2, 3]).toHaveLength(3);

// Asynchronous
await Hypothesis.expectAsync(
  asyncFunction()
).toResolve();

await Hypothesis.expectAsync(
  failingFunction()
).toReject();
```

## Types

### Core Types

```typescript
type NeuronType = 'cortical' | 'reflex' | 'sensory' | 'motor';
type ConnectionType = 'excitatory' | 'inhibitory' | 'modulatory';
type TransmissionSpeed = 'myelinated' | 'unmyelinated';
type NodeState = 'inactive' | 'active' | 'firing' | 'refractory' | 'failed';

interface Signal {
  id: string - Unique identifier for the signal.
  sourceId: string - The ID of the source neuron that emitted the signal.
  type: ConnectionType - The type of connection ('excitatory' | 'inhibitory' | 'modulatory').
  strength: number - The strength of the signal (0.0 - 1.0).
  payload: unknown - The actual data payload carried by the signal.
  timestamp: Date - The timestamp when the signal was created.
}

interface Decision {
  shouldFire: boolean;
  accumulatedSignal: number;
  timestamp: Date;
}

interface HealthStatus {
  healthy: boolean;
  lastCheck: Date;
  uptime: number;
  errors: number;
  metrics: Record<string, number>;
}
```

## Next Steps

- **[Tutorials](../tutorials/README.md)** - Hands-on examples
- **[System Guides](../systems/README.md)** - Detailed system documentation
- **[Examples](../examples/README.md)** - Code examples
