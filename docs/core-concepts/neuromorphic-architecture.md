# Neuromorphic Architecture

## Why Biological Metaphors?

Synapse Framework uses biological and medical metaphors to organize application architecture. This isn't just clever naming - it's a fundamental design philosophy that makes complex systems intuitive and maintainable.

### The Problem with Traditional Frameworks

Traditional frameworks often use abstract technical terms:
- Controllers, Services, Repositories
- Middleware, Handlers, Decorators
- Providers, Modules, Factories

While functional, these terms don't convey **purpose** or **relationships**. A "Service" could do anything. A "Module" could contain anything.

### The Synapse Approach

Synapse uses metaphors from the most sophisticated distributed system ever created: **the human body**.

Just as your body has specialized systems that work together seamlessly:
- **Nervous System** → Processes signals and coordinates actions
- **Circulatory System** → Distributes messages throughout the system
- **Immune System** → Protects against threats
- **Muscular System** → Performs transformations and work
- **Skeletal System** → Provides structure and validation

Your Synapse application has parallel systems that are immediately intuitive.

## Core Metaphor: The Neural Network

At its heart, Synapse models your application as a **neural network**:

```
[Input Signal]
      ↓
[Dendrite - Receive]
      ↓
[Soma - Process]
      ↓
[Axon - Transmit]
      ↓
[Synapse - Connect]
      ↓
[Next Neuron]
```

### NeuralNode: The Foundation

Everything in Synapse is a **NeuralNode** - a processing unit that:

1. **Receives** signals through dendrites (inputs)
2. **Integrates** signals to determine if threshold is met
3. **Processes** when activated
4. **Transmits** results through axons (outputs)
5. **Connects** to other nodes through synapses

```typescript
import { NeuralNode } from '@synapse-framework/core';

const node = new NeuralNode({
  id: 'data-processor',
  type: 'cortical',
  threshold: 0.7, // Activation threshold
});

// Lifecycle
await node.activate();

// Receive input signals
await node.receive({
  id: crypto.randomUUID(),
  sourceId: 'input-source',
  type: 'excitatory',
  strength: 0.8,
  payload: { data: 'process me' },
  timestamp: new Date(),
});

// Check if threshold exceeded
const decision = node.integrate();
if (decision.shouldFire) {
  const result = await node.process(decision.accumulatedSignal);
  // Transmit to connected nodes
}
```

**Key Insight**: This mirrors how real neurons work - they accumulate signals until a threshold is reached, then fire. This provides natural **backpressure** and **debouncing** for your application.

## Neuron Types

Just as the brain has different types of neurons, Synapse has specialized node types:

### 1. CorticalNeuron (Stateful Services)

Like neurons in the cerebral cortex, these maintain **persistent state** and handle complex logic:

```typescript
import { CorticalNeuron } from '@synapse-framework/core';

class UserService extends CorticalNeuron {
  private users: Map<string, User> = new Map();

  constructor() {
    super({
      id: 'user-service',
      type: 'cortical',
      threshold: 0.5,
    });
  }

  // State persists across invocations
  async process(input: Input): Promise<Output> {
    const user = this.users.get(input.data.userId);
    // Complex stateful logic
    return { data: user };
  }
}
```

**Use for**:
- Business logic services
- Long-running processes
- Stateful workflows
- Aggregation services

### 2. ReflexNeuron (Stateless Functions)

Like spinal reflex neurons, these provide **fast, stateless** responses:

```typescript
import { ReflexNeuron } from '@synapse-framework/core';

const imageProcessor = new ReflexNeuron({
  id: 'image-resize',
  type: 'reflex',
  threshold: 0.8,
});

// No persistent state
// Activates on demand
// Fast response
```

**Use for**:
- Serverless functions
- Event handlers
- Simple transformations
- Stateless operations

### 3. SensoryNeuron (Input Adapters)

Like sensory neurons that receive external stimuli:

```typescript
import { SensoryNeuron } from '@synapse-framework/core';

const apiInput = new SensoryNeuron({
  id: 'api-input',
  type: 'sensory',
  threshold: 0.3, // Low threshold - always responsive
});

// Converts external input to internal signals
```

**Use for**:
- API endpoints
- Event listeners
- Message queue consumers
- External integrations

### 4. MotorNeuron (Output Adapters)

Like motor neurons that trigger actions:

```typescript
import { MotorNeuron } from '@synapse-framework/core';

const emailSender = new MotorNeuron({
  id: 'email-sender',
  type: 'motor',
  threshold: 0.9, // High threshold - deliberate actions
});

// Triggers external actions
```

**Use for**:
- Email sending
- Database writes
- External API calls
- File operations

## Connections: The Synapses

Neurons are connected by **synapses** - typed, weighted connections:

```typescript
import { Connection } from '@synapse-framework/core';

const connection = new Connection({
  source: inputNode,
  target: processorNode,
  weight: 0.8,        // Signal amplification
  type: 'excitatory', // Activation type
  speed: 'myelinated' // Fast transmission
});

// Transmit signals
await connection.transmit(signal);

// Connections adapt over time (Hebbian learning)
connection.strengthen(); // Increase weight
connection.weaken();     // Decrease weight
```

### Connection Types

1. **Excitatory** - Promotes activation (positive signal)
2. **Inhibitory** - Prevents activation (negative signal)
3. **Modulatory** - Adjusts sensitivity (modifies threshold)

### Transmission Speed

1. **Myelinated** - Fast, direct connection (microservices in same cluster)
2. **Unmyelinated** - Slower, flexible (external services)

## Neural Circuits: Organizing Components

Individual neurons connect to form **circuits** - organized networks:

```typescript
import { NeuralCircuit } from '@synapse-framework/core';

const authCircuit = new NeuralCircuit({
  id: 'authentication-circuit'
});

// Add neurons
authCircuit.addNeuron(apiInput);
authCircuit.addNeuron(validator);
authCircuit.addNeuron(authenticator);
authCircuit.addNeuron(authorizer);

// Connect them
authCircuit.connect(apiInput, validator);
authCircuit.connect(validator, authenticator);
authCircuit.connect(authenticator, authorizer);

// Activate entire circuit
await authCircuit.activateAll();
```

### Circuit Patterns

**Feed-Forward** (No cycles):
```
Input → Process → Validate → Output
```

**Recurrent** (With feedback):
```
Input → Process ⇄ Validate → Output
         ↓                    ↑
         └────────────────────┘
```

**Lateral Inhibition** (Competitive):
```
  A ⊣ B ⊣ C
  ↓   ↓   ↓
  (Only strongest activates)
```

## Threshold-Based Activation

A key concept in Synapse is **threshold-based activation**:

```typescript
const node = new NeuralNode({
  threshold: 0.7 // Requires 70% signal strength
});

// Receive multiple weak signals
await node.receive({ strength: 0.3, ... }); // 30%
await node.receive({ strength: 0.2, ... }); // 50% total
await node.receive({ strength: 0.3, ... }); // 80% total

// Now threshold is exceeded
const decision = node.integrate();
// decision.shouldFire === true
```

### Benefits

1. **Natural Debouncing** - Filters out noise and spurious signals
2. **Backpressure** - Prevents overload by requiring sufficient signal strength
3. **Priority Handling** - Strong signals activate faster than weak ones
4. **Resource Optimization** - Only process when necessary

## Signal Types

Signals carry information between neurons:

```typescript
interface Signal {
  id: string;           // Unique identifier
  sourceId: string;     // Source neuron
  type: 'excitatory' | 'inhibitory' | 'modulatory';
  strength: number;     // 0.0 to 1.0
  payload: unknown;     // Actual data
  timestamp: Date;      // When sent
}
```

### Signal Strength

- **0.0 - 0.3**: Weak signal (suggestions, hints)
- **0.4 - 0.6**: Moderate signal (normal operation)
- **0.7 - 0.9**: Strong signal (important data)
- **1.0**: Critical signal (emergencies, errors)

## Synaptic Plasticity

Connections adapt over time based on usage - this is **plasticity**:

### Hebbian Learning

> "Neurons that fire together, wire together"

Frequently used connections **strengthen** automatically:

```typescript
import { Neuroplasticity } from '@synapse-framework/core';

const plasticity = new Neuroplasticity({
  pruningThreshold: 0.3,
  trainingIterations: 100,
});

// Train a connection (simulates usage)
plasticity.trainConnection(connection, 50);
// Weight increases over time

// Unused connections weaken
if (connection.weight < 0.3) {
  plasticity.pruneWeakConnections(circuit);
}
```

### Benefits

1. **Auto-Optimization** - Hot paths get faster automatically
2. **Resource Efficiency** - Unused connections are removed
3. **Self-Healing** - Alternative paths strengthen when primary fails
4. **Adaptive Performance** - System tunes itself to usage patterns

## The Body Systems Metaphor

Beyond neurons, Synapse organizes functionality into **body systems**:

### Nervous System (Core)
- **Purpose**: Signal processing and coordination
- **Components**: NeuralNode, Connection, Circuit
- **When to use**: Always - it's the foundation

### Circulatory System (Messaging)
- **Purpose**: Message distribution
- **Components**: Heart (broker), Artery/Vein (channels), BloodCell (messages)
- **When to use**: Event-driven architecture, pub-sub patterns

### Immune System (Security)
- **Purpose**: Protection and validation
- **Components**: TCell (auth), BCell (authz), Macrophage (sanitization)
- **When to use**: User authentication, input validation, threat detection

### Muscular System (Processing)
- **Purpose**: Data transformation
- **Components**: Muscle (pure functions), MuscleGroup (pipelines)
- **When to use**: Business logic, data pipelines, transformations

### Skeletal System (Structure)
- **Purpose**: Schema definition and validation
- **Components**: Bone (schemas)
- **When to use**: Type validation, runtime checking, API contracts

### Respiratory System (Networking)
- **Purpose**: External communication
- **Components**: Lung (HTTP client), Diaphragm (resilience)
- **When to use**: API calls, external services, microservices

### Glial System (Support)
- **Purpose**: State management and optimization
- **Components**: Astrocyte (state), Oligodendrocyte (perf), Microglia (health)
- **When to use**: Caching, monitoring, performance optimization

## Why This Works

### 1. Cognitive Ease

Biological metaphors leverage existing mental models. You already understand:
- The heart pumps blood (messages)
- The immune system fights infections (threats)
- Muscles do work (transformations)
- The skeleton provides structure (schemas)

### 2. Clear Separation of Concerns

Each system has a **single, clear purpose**. No ambiguity about where functionality belongs.

### 3. Natural Composition

Systems are designed to work together, just like body systems:
- Nervous system coordinates everything
- Circulatory system connects everything
- Immune system protects everything
- Glial system supports everything

### 4. Scalable Understanding

New team members can understand the architecture by understanding the metaphor. No need to memorize arbitrary patterns.

## Practical Example: Authentication Flow

Let's see how systems work together for a real use case:

```typescript
// 1. SENSORY: Receive HTTP request
const apiInput = new SensoryNeuron({ id: 'api-input' });

// 2. IMMUNE: Sanitize input
const sanitizer = new Macrophage({ id: 'sanitizer', xss: true });

// 3. SKELETAL: Validate schema
const loginSchema = new Bone('LoginSchema', z.object({
  email: z.string().email(),
  password: z.string()
}));

// 4. MUSCULAR: Hash password
const hasher = new Muscle('passwordHasher', (pwd) => hash(pwd));

// 5. NERVOUS: Business logic
const authService = new CorticalNeuron({ id: 'auth-service' });

// 6. IMMUNE: Authenticate
const authenticator = new TCell({ id: 'authenticator' });

// 7. GLIAL: Cache session
const sessionStore = new Astrocyte({ id: 'sessions' });

// 8. CIRCULATORY: Broadcast event
const eventBus = new Heart();

// Wire them together in a circuit
const authCircuit = new NeuralCircuit({ id: 'auth' });
authCircuit.addNeuron(apiInput);
authCircuit.addNeuron(sanitizer);
// ... add all components

// Flow:
// HTTP Request → Sanitize → Validate → Hash → Authenticate → Cache → Event
```

Each system does exactly what its metaphor suggests, creating an intuitive, maintainable flow.

## Next Steps

Now that you understand the neuromorphic architecture:

1. **[Learn Signal Flow](./signal-flow.md)** - How signals propagate through the system
2. **[Explore State Management](./state-management.md)** - Using the Glial System
3. **[Study System Guides](../systems/nervous/README.md)** - Deep dive into each system

## Key Takeaways

- Synapse uses biological metaphors for intuitive architecture
- NeuralNode is the fundamental building block
- Threshold-based activation provides natural backpressure
- Connections adapt through synaptic plasticity
- Body systems organize functionality by purpose
- Everything is type-safe and composable
- The metaphor makes complex systems understandable
