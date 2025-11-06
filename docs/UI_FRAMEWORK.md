# Synapse UI Framework - Neural-Inspired Components

## Overview

Synapse UI is a revolutionary framework-agnostic UI library built on biological principles. Components are modeled as neurons that communicate through signals, creating a self-sufficient, neural-inspired architecture.

## 🧠 Core Philosophy

Traditional frameworks use abstract concepts like "components" and "props." Synapse UI uses **biological metaphors**:

- **VisualNeuron** = Base component
- **SensoryNeuron** = Input components (Button, Input, Select)
- **MotorNeuron** = Action components (triggers side effects)
- **InterneuronUI** = Container components (Form, Layout)
- **Signals** = Data flow between components
- **Synapses** = Component connections
- **Threshold Activation** = Re-render triggers
- **Refractory Period** = Debouncing

## 🏗️ Architecture

### Component Hierarchy

```
VisualNeuron (abstract base)
  ├── SensoryNeuron (input capture)
  │   ├── Button
  │   ├── Input
  │   └── Select
  ├── MotorNeuron (action execution)
  └── InterneuronUI (composition)
      └── Form
```

### Signal Flow

```
User Interaction → Dendrite (receive) → Soma (process) → Axon (emit) → Render
```

## 🎨 Component Library

### Button

Neural-inspired button with press states and signal emission.

```typescript
import { Button } from '@synapse-framework/core/ui';

const submitButton = new Button({
  id: 'submit-btn',
  type: 'reflex',
  threshold: 0.5,
  props: {
    label: 'Submit',
    variant: 'primary', // primary | secondary | danger | success
    size: 'medium', // small | medium | large
    onClick: () => console.log('Neural signal received!'),
  },
  initialState: {
    pressed: false,
    hovered: false,
    disabled: false,
  },
});

await submitButton.activate();
const renderSignal = submitButton.render();
```

**Features:**
- 4 variants (primary, secondary, danger, success)
- 3 sizes (small, medium, large)
- Loading states
- Press animations
- Full ARIA accessibility

### Input

Text input with focus tracking and validation.

```typescript
import { Input } from '@synapse-framework/core/ui';

const emailInput = new Input({
  id: 'email-input',
  type: 'reflex',
  threshold: 0.3,
  props: {
    type: 'email',
    placeholder: 'Enter your email',
    value: '',
    onChange: (value) => console.log('Input:', value),
    label: 'Email Address',
    error: null, // Set to display error message
  },
  initialState: {
    focused: false,
    value: '',
    hasError: false,
  },
});
```

### Select

Dropdown selection with keyboard navigation.

```typescript
import { Select } from '@synapse-framework/core/ui';

const countrySelect = new Select({
  id: 'country-select',
  type: 'reflex',
  threshold: 0.5,
  props: {
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
    ],
    value: 'us',
    onChange: (value) => console.log('Selected:', value),
    label: 'Country',
  },
  initialState: {
    open: false,
    focused: false,
    selectedValue: 'us',
  },
});
```

### Form

Container component with validation and submission.

```typescript
import { Form, Button, Input } from '@synapse-framework/core/ui';

const loginForm = new Form({
  id: 'login-form',
  type: 'cortical',
  threshold: 0.5,
  props: {
    title: 'Login',
    onSubmit: async (data) => {
      console.log('Form data:', data);
      // Submit to API
    },
    validation: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!value.includes('@')) return 'Invalid email';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
    },
  },
  initialState: {
    values: {},
    errors: {},
    submitting: false,
    submitted: false,
  },
});

// Add child inputs
const emailInput = new Input({ ...emailConfig });
const passwordInput = new Input({ ...passwordConfig });

loginForm.addChild(emailInput);
loginForm.addChild(passwordInput);
```

## 🧬 State Management

### VisualAstrocyte

Redux-like state management with time-travel debugging.

```typescript
import { VisualAstrocyte } from '@synapse-framework/core/ui';

const stateManager = new VisualAstrocyte({
  id: 'app-state',
  maxHistorySize: 50,
  enableTimeTravel: true,
});

await stateManager.activate();

// Set state (nested paths supported)
stateManager.setState('user.profile.name', 'Alice');
stateManager.setState('user.profile.age', 30);

// Get state
const name = stateManager.getState('user.profile.name'); // 'Alice'
const user = stateManager.getState('user'); // { profile: { name: 'Alice', age: 30 } }

// Subscribe to changes
const unsubscribe = stateManager.subscribe('user.profile.name', (newValue, oldValue) => {
  console.log(`Name changed from ${oldValue} to ${newValue}`);
});

// Wildcard subscriptions
stateManager.subscribe('user.*', (newValue) => {
  console.log('User data changed:', newValue);
});

// Selectors (derived state with memoization)
stateManager.registerSelector('userFullName', (state) => {
  return `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim();
});

const fullName = stateManager.select('userFullName');

// Time-travel debugging
stateManager.undo(); // Go back one state
stateManager.redo(); // Go forward
stateManager.jumpToState(5); // Jump to specific history index

// State persistence
const snapshot = stateManager.exportSnapshot();
localStorage.setItem('appState', JSON.stringify(snapshot));

// Restore state
const savedSnapshot = JSON.parse(localStorage.getItem('appState'));
stateManager.importSnapshot(savedSnapshot);

// Middleware
stateManager.addMiddleware((path, value, prevValue) => {
  console.log(`State changed: ${path}`, prevValue, '->', value);
  return value; // Can transform the value
});
```

**Features:**
- Nested state paths
- Wildcard subscriptions
- Memoized selectors
- Time-travel (undo/redo/jump)
- State snapshots
- Middleware support
- 59 comprehensive tests

## ⚡ Rendering Optimization

### VisualOligodendrocyte

Component memoization and Virtual DOM diffing.

```typescript
import { VisualOligodendrocyte } from '@synapse-framework/core/ui';

const optimizer = new VisualOligodendrocyte({
  id: 'render-optimizer',
  maxCacheSize: 100,
});

await optimizer.activate();

// Memoize component renders
const vdom = button.render().data.vdom;
optimizer.memoizeRender('button-1', vdom, { label: 'Click' });

// Get cached render (if props match)
const cached = optimizer.getCachedRender('button-1', { label: 'Click' });
if (cached) {
  // Use cached version (skips re-render)
}

// Virtual DOM diffing
const oldTree = { tag: 'div', children: ['Old'] };
const newTree = { tag: 'div', children: ['New'] };
const patches = optimizer.diff(oldTree, newTree);

// Track render performance
optimizer.recordRenderTime('my-component', 16); // ms
const metrics = optimizer.getRenderMetrics('my-component');
// { componentId, renderCount, averageRenderTime, lastRenderTimestamp }

// Find slow components
const slowOnes = optimizer.getSlowComponents(50); // > 50ms

// Lazy loading
optimizer.markLazyComponent('heavy-chart', './HeavyChart.ts');
if (optimizer.isComponentLoaded('heavy-chart')) {
  // Component is loaded
}

// Myelination (optimize hot paths)
optimizer.trackComponentUsage('frequently-used-button');
optimizer.myelinateHotPaths(10); // Threshold: 10 uses
const isOptimized = optimizer.isMyelinated('frequently-used-button');
```

**Features:**
- Component render memoization
- Virtual DOM diffing algorithm
- Performance tracking
- Lazy loading support
- Hot path optimization ("myelination")
- 15 comprehensive tests

## 🎯 Key Advantages

### 1. Framework Agnostic
No React, Vue, or Angular required. Pure TypeScript.

### 2. Biologically Inspired
Concepts map directly to nervous system:
- Threshold activation = natural backpressure
- Refractory period = built-in debouncing
- Synaptic plasticity = adaptive optimization

### 3. Self-Sufficient
Components manage their own:
- Lifecycle (activate/deactivate)
- State (internal + reactive)
- Events (signal emission)
- Rendering (Virtual DOM)

### 4. Type-Safe
Full TypeScript support with strict types.

### 5. Test-Driven
- 334 total tests
- 71% pass rate
- TDD approach throughout

## 📊 Statistics

- **Total Code**: ~4,000 lines
- **Components**: 4 base classes + 4 concrete components
- **State Management**: Full Redux-like system
- **Optimization**: Virtual DOM + memoization
- **Tests**: 334 comprehensive tests
- **Pass Rate**: 71% (237 passing)

## 🔬 Neural Terminology

| Term | Meaning | Implementation |
|------|---------|----------------|
| **Dendrite** | Input receiver | `receive()` method, props |
| **Soma** | Processing center | `executeProcessing()`, state |
| **Axon** | Output transmitter | `render()`, `emit()` |
| **Synapse** | Connection | Component links |
| **Signal** | Information unit | Events, state changes |
| **Threshold** | Activation level | Re-render trigger |
| **Refractory Period** | Recovery time | Debouncing |
| **Astrocyte** | State manager | VisualAstrocyte |
| **Oligodendrocyte** | Optimizer | VisualOligodendrocyte |
| **Myelination** | Speed optimization | Hot path caching |

## 🚀 Getting Started

```bash
npm install @synapse-framework/core
```

```typescript
import { Button, VisualAstrocyte } from '@synapse-framework/core/ui';

// Create state manager
const state = new VisualAstrocyte({ id: 'app-state' });
await state.activate();

// Create button
const button = new Button({
  id: 'my-button',
  type: 'reflex',
  threshold: 0.5,
  props: {
    label: 'Click Me',
    variant: 'primary',
    onClick: () => state.setState('clicks', state.getState('clicks') + 1),
  },
});

await button.activate();
const renderSignal = button.render();

// Render to DOM (you provide the renderer)
renderToDOM(document.body, renderSignal.data.vdom);
```

## 🌟 Philosophy

> "The nervous system has evolved over 3 billion years to solve distributed computing problems. Why not learn from it?"

Synapse UI brings biological computing patterns to web development:
- **Neural networks** inspire component architecture
- **Synaptic plasticity** enables adaptive optimization
- **Threshold activation** provides natural backpressure
- **Refractory periods** prevent excessive re-renders

The result is a framework that's both innovative and battle-tested by evolution.

---

Built with ❤️ by the Synapse team
