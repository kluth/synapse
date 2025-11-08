# The Anatomy Theater - Complete Demo

This directory contains a comprehensive demonstration of **The Anatomy Theater**, a component development and documentation system for the Synapse framework.

## Overview

The Anatomy Theater is a powerful alternative to Storybook, designed specifically for the Synapse framework with medical-themed terminology and neural-inspired architecture.

## What's Included

### 1. Button Component (`ButtonComponent.ts`)

A sample button component that demonstrates:
- Props management (label, variant, disabled, onClick)
- State management (pressed, clickCount)
- Event emission and neural signals
- Style variants (primary, secondary, danger)
- Interaction handling

### 2. Specimens (`button.specimens.ts`)

Showcases how to create component variations with:
- **Specimen metadata** (id, name, category, tags, description)
- **Observations** - behavioral assertions and tests
- **Dissections** - structural documentation of props and state
- **Multiple variants** (Default, Primary, Secondary, Danger, Disabled, Interactive)

### 3. Laboratory Tests (`button.laboratory.ts`)

Demonstrates the testing system with:
- **Laboratory** - test orchestrator
- **Experiments** - individual test scenarios
- **TestSubject** - component testing wrapper
- **Hypothesis** - behavioral assertions
- **Multiple test cases** covering rendering, clicks, states, variants

### 4. Atlas Documentation (`button.atlas.ts`)

Shows comprehensive documentation with:
- **Atlas** - documentation hub with search and aggregation
- **ComponentCatalogue** - component inventory with dependencies
- **Diagram** - visual documentation (state machines, hierarchies)
- **Protocol** - usage guidelines and best practices
- **WCAG guidelines** - accessibility documentation

### 5. Complete Integration (`theater.complete.ts`)

Full theater environment including:
- **Theater** - main orchestrator
- **Stage** - component rendering platform
- **Amphitheater** - component gallery
- **TheaterServer** - development server
- **HotReload** - file watching with hot reload
- **WebSocketBridge** - real-time communication

### 6. Integration Tests (`__tests__/integration.test.ts`)

Comprehensive tests verifying:
- Component functionality
- Specimen system
- Laboratory testing
- Atlas documentation
- Server components
- Full integration

## The Anatomy Theater Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      THE ANATOMY THEATER                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌────────┐    ┌──────────────┐            │
│  │ Theater  │───▶│ Stage  │───▶│ Amphitheater │            │
│  │  (Core)  │    │(Render)│    │   (Gallery)  │            │
│  └──────────┘    └────────┘    └──────────────┘            │
│                                                              │
│  ┌──────────┐    ┌────────────┐   ┌──────────┐            │
│  │ Specimen │───▶│ Laboratory │◀──│  Atlas   │            │
│  │(Variants)│    │  (Testing) │   │  (Docs)  │            │
│  └──────────┘    └────────────┘   └──────────┘            │
│                                                              │
│  ┌──────────────┐  ┌────────────┐  ┌───────────┐          │
│  │TheaterServer │─▶│ HotReload  │─▶│ WebSocket │          │
│  │(Dev Server)  │  │  (Watch)   │  │  (Bridge) │          │
│  └──────────────┘  └────────────┘  └───────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 🎭 Theater Core
- Component lifecycle management
- State orchestration
- Event-driven architecture
- Real-time updates

### 📦 Specimen System
- Component variations and states
- Behavioral observations
- Structural dissections
- Metadata and categorization

### 🧪 Laboratory
- Component testing framework
- Hypothesis-based assertions
- Test subject wrapper
- Experiment orchestration
- Rich reporting

### 📚 Atlas
- Comprehensive documentation
- Component catalogue
- Visual diagrams (Mermaid/GraphViz)
- Usage protocols and best practices
- WCAG accessibility guidelines
- Search and filtering

### 🚀 Development Server
- HTTP development server
- Hot module reload
- WebSocket real-time communication
- File watching and change detection
- Broadcast channels

## Usage Examples

### Creating a Specimen

```typescript
import { Specimen } from '../../src/theater/specimens/Specimen';
import { createObservations } from '../../src/theater/specimens/Observation';

const ButtonSpecimen = new Specimen(
  {
    id: 'button-primary',
    name: 'Primary Button',
    category: 'Forms',
    tags: ['interactive', 'button'],
  },
  (context) => {
    const button = new ButtonComponent({ label: 'Click Me', variant: 'primary' });
    button.activate();
    return button.render();
  }
);

// Add observations
ButtonSpecimen.addObservation(
  createObservations('button-tests', [
    {
      name: 'Renders correctly',
      description: 'Button should render with label',
      assert: (context) => context.component !== undefined,
    },
  ])
);
```

### Running Laboratory Tests

```typescript
import { Laboratory } from '../../src/theater/laboratory/Laboratory';
import { Experiment } from '../../src/theater/laboratory/Experiment';

const lab = new Laboratory({ name: 'Button Tests' });

const experiment = new Experiment({
  id: 'button-click',
  name: 'Click Behavior',
});

experiment.setTest(async (subject) => {
  subject.interact({ type: 'click' });
  return subject.getComponent().getState().clickCount === 1;
});

lab.registerExperiment(experiment);
await lab.runAll();

const report = lab.generateReport();
console.log(report.formatAs('text'));
```

### Creating Documentation

```typescript
import { Atlas } from '../../src/theater/atlas/Atlas';

const atlas = new Atlas({ name: 'Component Docs' });

atlas.document({
  id: 'button',
  name: 'Button',
  description: 'Interactive button component',
  category: 'Forms',
  tags: ['button', 'interactive'],
  props: [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: 'Button label text',
    },
  ],
  state: [],
  signals: [],
  examples: [],
  related: [],
  source: 'ButtonComponent.ts',
  timestamp: Date.now(),
});

const results = atlas.search({ text: 'button' });
```

### Starting the Theater

```typescript
import { CompleteTheaterDemo } from './theater.complete';

const demo = new CompleteTheaterDemo();
await demo.start();

// Theater is now running with:
// - Development server at http://localhost:6006
// - WebSocket at ws://localhost:6007
// - Hot reload enabled
// - All specimens loaded
// - Documentation generated
```

## Running the Demo

```bash
# Install dependencies
npm install

# Run the complete demo
npm run demo:theater

# Run integration tests
npm test examples/theater-demo

# Run specific demo features
npm run demo:specimens  # Show specimen gallery
npm run demo:laboratory # Run laboratory tests
npm run demo:docs      # Generate documentation
```

## Medical Metaphor Terminology

The Anatomy Theater uses medical/anatomical terminology:

- **Theater** - The main operating theater where components are showcased
- **Stage** - The surgical stage where components are rendered
- **Amphitheater** - The observation gallery for viewing components
- **Specimen** - A component variation or state to be examined
- **Observation** - Behavioral test or assertion
- **Dissection** - Structural analysis of component anatomy
- **Laboratory** - Testing environment
- **Experiment** - Individual test scenario
- **Hypothesis** - Test assertion
- **Atlas** - Medical reference documentation
- **Protocol** - Medical procedure guidelines

## Architecture Principles

### Neural-Inspired
Built on Synapse's neural metaphor with:
- VisualNeuron base class for components
- Signal-based event system
- Synaptic connections between components

### Event-Driven
All components use EventEmitter for:
- Lifecycle events
- State changes
- User interactions
- System notifications

### Medical Precision
Emphasizes:
- Thorough examination (dissection)
- Scientific testing (laboratory)
- Detailed documentation (atlas)
- Best practices (protocols)

### Developer Experience
Focuses on:
- Type safety with TypeScript
- Hot reload for fast iteration
- Real-time updates via WebSocket
- Comprehensive testing
- Rich documentation

## Component Structure

### Core Layers

1. **Presentation Layer** (Stage, Amphitheater)
   - Component rendering
   - Gallery organization
   - Visual presentation

2. **Documentation Layer** (Atlas, Catalogue, Protocol)
   - Component documentation
   - Usage guidelines
   - Dependency tracking

3. **Testing Layer** (Laboratory, Experiment, Hypothesis)
   - Component testing
   - Behavioral validation
   - Test reporting

4. **Server Layer** (TheaterServer, HotReload, WebSocket)
   - Development server
   - File watching
   - Real-time communication

## Best Practices

### Creating Specimens
- Use descriptive IDs and names
- Categorize appropriately
- Add relevant tags
- Include observations for key behaviors
- Provide dissection for structure

### Writing Tests
- Create focused experiments
- Use clear hypothesis names
- Test one behavior per experiment
- Include setup and teardown
- Verify both positive and negative cases

### Documentation
- Document all props with types
- Include usage examples
- Add accessibility guidelines
- Reference WCAG criteria
- Show common patterns

### Development
- Enable hot reload during development
- Use WebSocket for live updates
- Monitor server statistics
- Export data for debugging
- Follow the medical metaphor

## API Reference

See the main Theater documentation for complete API reference:
- `/src/theater/core/` - Core components
- `/src/theater/specimens/` - Specimen system
- `/src/theater/laboratory/` - Testing framework
- `/src/theater/atlas/` - Documentation system
- `/src/theater/server/` - Development server
- `/src/theater/instruments/` - Debugging tools

## License

Part of the Synapse framework.
