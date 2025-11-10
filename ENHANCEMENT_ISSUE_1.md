# [ENHANCEMENT-1] Reactive State Management with Signals

## Title
Implement Synchronous Reactive Signals System for UI State Management

## Problem Description

**The Pain Point:**

The Synapse Framework currently has excellent asynchronous event handling (EventBus, Circulatory patterns) but lacks synchronous reactive primitives for modern UI development. This creates a gap between:

1. **EventBus** - Asynchronous pub-sub (great for loose coupling, but imperative)
2. **Theater Testing** - Reactive testing framework (unidirectional, no state feedback)
3. **UI Components** - SkinCell components (stateless, event-driven)

Developers building reactive UIs need:
- **Synchronous signal tracking** (like Solid.js signals or Vue 3 refs)
- **Automatic dependency tracking** (computed properties)
- **Efficient change detection** (minimal re-renders)
- **Declarative state management** (vs imperative event handlers)

**Who Experiences This Pain:**

- **Casual Users**: Need simple state management without Redux complexity
- **Hobbyist Users**: Want reactive patterns but without external libraries (Svelte/Solid)
- **Professional Users**: Building complex dashboards need efficient change detection for performance

**Current Gap:**

The nervous system lacks a synchronous reactive layer. EventBus is async-first, NeuralNode processes are threshold-based, and UI state management is event-driven. There's no equivalent to:
- Signals (Solid.js)
- Reactive refs (Vue 3)
- Reactive state (MobX)

---

## The Proposal

### Core Architecture

**Synapse Signals - A New Reactive Subsystem**

```typescript
// src/nervous/index.ts - New module

// 1. Core Signal Primitive
import { Signal, createSignal, createEffect } from '@synapse-framework/core';

// Simple reactive value
const [count, setCount] = createSignal(0);

// Access value (triggers dependency tracking)
console.log(count()); // 0

// Update value (notifies dependents)
setCount(1);

// 2. Computed Signals (derived values)
const [count, setCount] = createSignal(0);
const doubled = createComputed(() => count() * 2);

console.log(doubled()); // 0
setCount(5);
console.log(doubled()); // 10 (automatically recomputed)

// 3. Side Effects (reactions to changes)
createEffect(() => {
  console.log(`Count changed: ${count()}`);
  // Re-runs whenever count() changes
});

setCount(1); // Logs: "Count changed: 1"

// 4. Batched Updates (reduce reactivity thrashing)
batch(() => {
  setCount(1);
  setCount(2);
  setCount(3);
  // Only one re-evaluation, not three
});

// 5. Memo (cached computations)
const expensive = createMemo(() => {
  return performExpensiveCalculation(data());
});

// 6. Resource API (async data fetching)
const [data] = createResource(userId, async (id) => {
  return await fetchUserData(id);
});

// 7. Store (object reactivity)
const store = createStore({
  user: { name: 'Alice', age: 30 },
  todos: [
    { id: 1, title: 'Learn Synapse', completed: false },
  ],
});

// Reactive property access
console.log(store.user.name); // 'Alice'

// Reactive property updates
store.user.age = 31; // Triggers reactivity

// Nested access still reactive
const userName = () => store.user.name;
```

### Integration with Existing Systems

**How Signals Complement Nervous System:**

```typescript
// Nervous System (async event flow)
import { EventBus } from '@synapse-framework/core';
import { createSignal } from '@synapse-framework/core';

const eventBus = new EventBus();
const [lastEvent, setLastEvent] = createSignal<Event | null>(null);

// Bridge: EventBus → Signals (async to sync)
eventBus.subscribe('user:updated', (event) => {
  setLastEvent(event); // Synchronously update signal
});

// Bridge: Signals → EventBus (computed event emission)
createEffect(() => {
  if (lastEvent()?.type === 'critical') {
    eventBus.emit('alert:critical', { event: lastEvent() });
  }
});
```

**Integration with Skin Layer (UI Components):**

```typescript
// src/skin/receptors/ReactiveInput.ts
import { Receptor } from './Receptor';
import { createSignal, createEffect } from '@synapse-framework/core';

export class ReactiveInput extends Receptor {
  private value: ReturnType<typeof createSignal<string>>;

  constructor(config: { initialValue?: string }) {
    super(config);
    this.value = createSignal(config.initialValue ?? '');

    // Reactive DOM updates
    createEffect(() => {
      this.element.value = this.value[0]();
    });

    // UI → Signal binding
    this.element.addEventListener('input', (e) => {
      this.value[1]((e.target as HTMLInputElement).value);
    });
  }

  getValue() {
    return this.value[0]();
  }

  setValue(val: string) {
    this.value[1](val);
  }
}
```

**Integration with Theater (Testing):**

```typescript
// test-signals.ts
import { createSignal, createEffect, createComputed } from '@synapse-framework/core';
import { createHypothesis } from '@synapse-framework/core';

const hypothesis = createHypothesis('Signal Reactivity');

hypothesis.case('computed signals recompute on dependency change', () => {
  const [x, setX] = createSignal(5);
  const squared = createComputed(() => x() * x());

  expect(squared()).toBe(25);

  setX(10);
  expect(squared()).toBe(100); // Auto-recomputed
});

hypothesis.case('effects run on signal changes', (done) => {
  const [name, setName] = createSignal('Alice');
  let effectRuns = 0;

  createEffect(() => {
    name(); // Track dependency
    effectRuns++;
  });

  expect(effectRuns).toBe(1); // Initial run
  setName('Bob');
  expect(effectRuns).toBe(2); // Re-run on change
  done();
});
```

### Component Architecture

```typescript
// src/nervous/core/Signal.ts
export interface SignalOptions<T> {
  initialValue: T;
  equals?: (a: T, b: T) => boolean;
  onSubscribe?: (signal: Signal<T>) => void;
}

export class Signal<T> {
  private value: T;
  private listeners = new Set<() => void>();
  private dependents = new Set<() => void>();
  private equals: (a: T, b: T) => boolean;

  constructor(initialValue: T, options: Partial<SignalOptions<T>> = {}) {
    this.value = initialValue;
    this.equals = options.equals ?? ((a, b) => a === b);
  }

  // Get current value (tracks dependency if in effect)
  public get(): T {
    trackDependency(this);
    return this.value;
  }

  // Set new value (notifies dependents)
  public set(newValue: T): void {
    if (!this.equals(this.value, newValue)) {
      this.value = newValue;
      this.notifyDependents();
    }
  }

  // Subscribe to changes
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify dependents of change
  private notifyDependents(): void {
    this.listeners.forEach(listener => listener());
    this.dependents.forEach(dependent => dependent());
  }
}

// src/nervous/core/Effect.ts
export interface EffectCleanup {
  (): void;
}

let currentEffect: (() => EffectCleanup | void) | null = null;
const dependencyGraph = new WeakMap<Signal<any>, Set<() => void>>();

export function createEffect(fn: () => EffectCleanup | void): () => void {
  let cleanup: EffectCleanup | void;
  let isRunning = false;

  const effect = () => {
    if (isRunning) return; // Prevent recursion
    isRunning = true;

    cleanup?.();
    currentEffect = fn;
    cleanup = fn();
    currentEffect = null;

    isRunning = false;
  };

  // Initial run
  effect();

  return () => {
    cleanup?.();
  };
}

export function trackDependency(signal: Signal<any>): void {
  if (currentEffect) {
    const deps = dependencyGraph.get(signal) ?? new Set();
    deps.add(currentEffect);
    dependencyGraph.set(signal, deps);
  }
}
```

### Advanced Features

**Computed Signals:**

```typescript
export function createComputed<T>(
  fn: () => T,
  options?: { equals?: (a: T, b: T) => boolean }
): () => T {
  const [value, setValue] = createSignal<T>(undefined as any, options);
  createEffect(() => {
    setValue(fn());
  });
  return () => value();
}
```

**Batching Updates:**

```typescript
let batchCount = 0;
const batchQueue = new Set<() => void>();

export function batch<T>(fn: () => T): T {
  batchCount++;
  const result = fn();
  batchCount--;

  if (batchCount === 0) {
    batchQueue.forEach(notify => notify());
    batchQueue.clear();
  }

  return result;
}
```

**Store Pattern (Object Reactivity):**

```typescript
export function createStore<T extends object>(initial: T): T {
  const signals = new Map<string, Signal<any>>();

  const handler: ProxyHandler<T> = {
    get(target, prop: string) {
      if (!signals.has(prop)) {
        signals.set(prop, new Signal(target[prop as keyof T]));
      }
      const signal = signals.get(prop)!;
      return typeof signal.get() === 'object'
        ? createStore(signal.get())
        : signal.get();
    },

    set(target, prop: string, value: any) {
      if (!signals.has(prop)) {
        signals.set(prop, new Signal(value));
      }
      signals.get(prop)!.set(value);
      return true;
    },
  };

  return new Proxy(initial, handler);
}
```

---

## Persona Value

### Casual User
**Value**: "I can build reactive UIs without learning Redux or complex state management"

- Synchronous signals are intuitive (`signal()` to read, `signal(newValue)` to write)
- No boilerplate or middleware required
- Automatic dependency tracking (no manual selectors)
- **Time saved**: UI state management time reduced from 2 hours to 15 minutes for simple features

### Hobbyist User
**Value**: "I have a complete reactive system that works with my Synapse components"

- Composable signals with computed, effects, memos
- Can build complex reactive patterns (Redux-like, MobX-like, Svelte-like)
- Full TypeScript support with excellent inference
- **Flexibility**: Can implement any reactive pattern without external libraries

### Professional (Frontend Developer)
**Value**: "Efficient change detection and reactive rendering without performance overhead"

- Automatic dependency graph prevents unnecessary re-computations
- Batching support minimizes re-renders
- Server-side compatible (no DOM coupling in core signal system)
- **API Automation**: Can wire backend operations to reactive UI state via signals → effects → EventBus

### Professional (Backend Developer)
**Value**: "Signals as a unifying abstraction for state management and event handling"

- Signals work in Node.js (not browser-only)
- Can manage service state reactively (similar to Akka reactive patterns)
- Bridges async (EventBus) and sync (Signals) paradigms
- **Integration**: Service state can expose signals that applications can reactively bind to

---

## Acceptance Criteria

### GIVEN I am a casual developer
**WHEN** I create a signal with `createSignal(0)`
**THEN** I can read it with `signal()` and update it with `signal(newValue)`
**AND** changes automatically notify dependents without manual subscription

### GIVEN I am building a reactive form
**WHEN** I create computed signals for form validation
**THEN** validation automatically re-runs when inputs change
**AND** invalid fields are flagged without manual re-validation calls

### GIVEN I have multiple signals that form a dependency graph
**WHEN** I update a root signal
**THEN** all computed signals depending on it automatically recompute
**AND** effects re-run only once (batched, not cascaded)

### GIVEN I want to integrate signals with my NeuralNode
**WHEN** a signal changes inside an effect
**THEN** I can emit an event via EventBus
**AND** the operation is performant (< 1ms overhead per signal update)

### GIVEN I have expensive computations
**WHEN** I use `createMemo()`
**THEN** the computation caches its result
**AND** it only recomputes when dependencies actually change

### GIVEN I want to fetch remote data reactively
**WHEN** I use `createResource(userId, fetchUser)`
**THEN** it handles loading, error, and success states
**AND** cache refetches automatically when the userId signal changes

### GIVEN I have Theater tests
**WHEN** I test signal reactivity
**THEN** I can use hypothesis.case() to test effects and computed signals
**AND** all test cases pass with 95%+ coverage

### GIVEN I'm using createStore() for object state
**WHEN** I update nested properties (e.g., `store.user.name = 'Bob'`)
**THEN** only affected dependents recompute (granular reactivity)
**AND** deep updates don't trigger unnecessary re-evaluations

### GIVEN I want batched updates
**WHEN** I call `batch(() => { setState1(...); setState2(...); })`
**THEN** dependent effects run once, not multiple times
**AND** batching provides measurable performance improvement (10x+ for multiple updates)

### GIVEN I'm building a TypeScript application
**WHEN** I use signals, computed, and effects
**THEN** TypeScript inference works perfectly
**AND** I get full autocomplete and type safety without manual type annotations

---

## Implementation Guidance

### New Files to Create
```
src/nervous/
  core/
    Signal.ts          - Core signal primitive (100 lines)
    Effect.ts          - Effect/reactivity system (150 lines)
    Computed.ts        - Computed signals (80 lines)
    Memo.ts            - Memoization (100 lines)
    Store.ts           - Object reactivity (120 lines)
    Batch.ts           - Update batching (60 lines)
    index.ts           - Exports
  adapters/
    ToEventBus.ts      - Signal → EventBus bridge (80 lines)
    FromEventBus.ts    - EventBus → Signal bridge (80 lines)
  __tests__/
    Signal.test.ts     - 40+ test cases
    Effect.test.ts     - 30+ test cases
    Store.test.ts      - 25+ test cases
    Integration.test.ts - 20+ test cases
```

### Test Strategy
- **Unit Tests**: Signal primitives, computed, effects (95+ tests)
- **Integration Tests**: Signal ↔ EventBus bridges (20+ tests)
- **Performance Tests**: Batching, change detection (10+ benchmarks)
- **UI Integration Tests**: Reactive components (15+ tests)

### Documentation Requirements
- **API Docs**: Complete signal system documentation
- **Migration Guide**: From event-driven to reactive patterns
- **Examples**: Todo app, form validation, real-time dashboard
- **Performance Guide**: Best practices for efficient reactivity

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Signal update latency | < 1ms |
| Computed recompute latency | < 5ms |
| Batch update overhead | < 2x baseline |
| Memory per signal | < 100 bytes |
| TypeScript inference | 100% type-safe |
| Test coverage | 95%+ |
| Documentation completeness | 100% |
| Example applications | 5+ with video tutorials |

---

## Dependencies
- No new npm dependencies required (pure TypeScript)
- Fully compatible with existing EventBus, Skeletal, UI systems
- Can coexist with current event-driven architecture

---

## Risk Assessment
- **Low Risk**: Pure synchronous system, no external dependencies
- **Compatibility**: Fully backward compatible with existing code
- **Performance**: Reactive overhead is minimal (dependency tracking in O(1) amortized time)

---

## Rollout Strategy
1. **Phase 1**: Core signal primitives (Signal, createSignal, createEffect)
2. **Phase 2**: Derived values (computed, memo)
3. **Phase 3**: Object reactivity (createStore)
4. **Phase 4**: Resource API (async data fetching)
5. **Phase 5**: EventBus bridges and examples

---

## Future Enhancements
- Serialization/deserialization of signal graphs
- Time-travel debugging for signals
- Reactive query builder for data fetching
- DevTools integration for signal monitoring
- Integration with Theater's state explorer

