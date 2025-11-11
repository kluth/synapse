# Official Domain Terminology Glossary (Ubiquitous Language)

## Overview

This document defines the Official Domain Terminology (Ubiquitous Language) for the Synapse Framework. All code, documentation, and communication should use these medical/biological terms consistently.

**Principle**: The entire codebase should reflect the body and all that belongs to it. Every term should align with medical/biological terminology.

---

## Nervous System

### Core Components

- **NeuralNode**: Base class for all processing units. Represents a neuron in the nervous system.
- **CorticalNeuron**: Stateful processing unit (like neurons in the cerebral cortex). Maintains persistent state.
- **ReflexNeuron**: Stateless processing unit (like spinal reflex neurons). Fast, stateless responses.
- **SensoryNeuron**: Input processing unit that receives external stimuli and converts them to signals.
- **MotorNeuron**: Output processing unit that triggers actions and side effects.
- **Connection**: Represents a synaptic connection between neurons.
- **Synapse**: The connection point between neurons where signals are transmitted.
- **NeuralCircuit**: Organized network of connected neurons.
- **Neuroplasticity**: System for adaptive rewiring and self-healing of neural connections.

### Neural Anatomy Terms

- **Dendrite**: Input receptor of a neuron (receives signals).
- **Soma**: Cell body of a neuron (processes signals).
- **Axon**: Output transmitter of a neuron (sends signals).
- **Threshold**: Activation threshold for a neuron (0.0-1.0).
- **Signal**: Neural signal transmitted between neurons.
- **Excitatory**: Signal type that promotes activation.
- **Inhibitory**: Signal type that prevents activation.
- **Myelinated**: Fast, optimized connection (like myelinated nerve fibers).
- **Refractory Period**: Time period after firing when neuron cannot fire again (debouncing).

---

## Circulatory System

### Core Components

- **Heart**: Central message broker that routes and distributes messages.
- **Artery**: Outgoing message channel (carries messages away from heart).
- **Vein**: Incoming message channel (carries messages to heart).
- **BloodCell**: Message container that carries data through the circulatory system.

### Message Patterns

- **PublishSubscribe**: Pub-sub messaging pattern.
- **RequestResponse**: Request-response messaging pattern.
- **EventSourcing**: Event sourcing pattern for state reconstruction.
- **Saga**: Distributed transaction pattern.
- **FireAndForget**: Fire-and-forget messaging pattern.

---

## Immune System

### Core Components

- **TCell**: Authentication system (like T-cells that identify cells).
- **BCell**: Authorization system (like B-cells that produce antibodies).
- **Macrophage**: Input sanitization system (like macrophages that engulf pathogens).
- **Antibody**: Threat detection system (like antibodies that identify threats).

### Immune Terms

- **Session**: Active authentication session.
- **Token**: Authentication token.
- **Permission**: Authorization permission.
- **Role**: Authorization role.
- **Threat**: Security threat detected by antibody.
- **Sanitization**: Input sanitization performed by macrophage.

---

## Skeletal System

### Core Components

- **Bone**: Immutable data model with schema validation.
- **Schema**: Structure definition for a bone.
- **FieldSchema**: Field definition within a schema.
- **Validator**: Validation function for data integrity.
- **ValidationResult**: Result of validation operation.

### Skeletal Terms (Planned/Conceptual)

- **Joint**: Relationship between bones (planned).
- **Marrow**: Factory for generating bone instances (planned).
- **Cartilage**: Interface between bones (planned).
- **Periosteum**: Outer validation layer (planned).
- **Calcium**: Type constraints that strengthen structure (planned).

---

## Muscular System

### Core Components

- **Muscle**: Pure function wrapper for business logic operations.
- **MuscleGroup**: Pipeline of muscles that execute in sequence.
- **MuscleMemory**: Caching system for muscle results.

### Built-in Muscles

- **MapMuscle**: Transformation muscle (maps over collections).
- **FilterMuscle**: Filtering muscle (filters collections).
- **ReduceMuscle**: Reduction muscle (reduces collections).
- **SortMuscle**: Sorting muscle (sorts collections).
- **TransformMuscle**: Generic transformation muscle.
- **ComputeMuscle**: Computation muscle.
- **AggregateMuscle**: Aggregation muscle.

---

## Respiratory System

### Core Components

- **Lung**: HTTP client with resilience patterns.
- **Diaphragm**: Resilience system (retry, circuit breaker, throttling, bulkhead).
- **Router**: HTTP routing system.
- **Resource**: External resource connection (database, cache, storage).
- **ResourcePool**: Pool of reusable resource connections.

### Protocol Adapters

- **RestAdapter**: REST API adapter.
- **GraphQLAdapter**: GraphQL API adapter.
- **WebSocketAdapter**: WebSocket adapter.
- **ProtocolAdapter**: Base protocol adapter.

### Resource Types

- **DatabaseResource**: Database connection resource.
- **CacheResource**: Cache connection resource.
- **StorageResource**: Storage connection resource.

---

## Glial System

### Core Components

- **Astrocyte**: State management and caching (like astrocytes that maintain homeostasis).
- **Oligodendrocyte**: Performance optimization and connection pooling (like oligodendrocytes that myelinate axons).
- **Microglia**: Health monitoring and error tracking (like microglia that monitor brain health).
- **Ependymal**: API gateway and request routing (like ependymal cells that line ventricles).

### Glial Terms

- **Cache**: State cache managed by astrocyte.
- **Connection Pool**: Pool of connections managed by oligodendrocyte.
- **Health Check**: Health monitoring check performed by microglia.
- **Alert**: Health alert emitted by microglia.

---

## Skin/Integumentary System

### Core Components

- **SkinCell**: Base class for all skin layer UI components (replaces VisualNeuron).
- **Receptor**: Input component that detects external stimuli (replaces SensoryNeuron).
- **Effector**: Output component that produces responses (replaces MotorNeuron).
- **DermalLayer**: Container/layout component (replaces InterneuronUI).

### Receptor Types

- **TouchReceptor**: Touch/click input receptor (replaces Button).
- **TextReceptor**: Text input receptor (replaces Input).
- **PressureReceptor**: Pressure-sensitive input receptor (planned).
- **VibrationReceptor**: Haptic feedback receptor (planned).

### Skin Cell Types (Planned/Conceptual)

- **Keratinocyte**: Visual component cell (planned).
- **Melanocyte**: Theming/styling cell (planned).
- **LangerhansCell**: Event detection cell (planned).
- **Fibroblast**: Layout/structure cell (planned).
- **Adipocyte**: State storage cell (replaces VisualAstrocyte).
- **BloodVessel**: Data flow pipe (planned).

---

## Theater System (Medical/Anatomical)

### Core Components

- **Theater**: Main operating theater orchestrator.
- **Stage**: Surgical stage where components are rendered.
- **Amphitheater**: Observation gallery for viewing components.
- **Specimen**: Component variation or state to be examined.
- **Observation**: Behavioral test or assertion.
- **Dissection**: Structural analysis of component anatomy.
- **Laboratory**: Testing environment.
- **Experiment**: Individual test scenario.
- **Hypothesis**: Test assertion.
- **TestSubject**: Component being tested.
- **Atlas**: Medical reference documentation.
- **Protocol**: Medical procedure guidelines.
- **Instrument**: Diagnostic instrument (microscope, profiler, etc.).
- **Microscope**: Inspection instrument for examining components.
- **LabReport**: Laboratory test report.

### Instruments

- **Microscope**: Component inspection instrument.
- **StateExplorer**: State inspection instrument.
- **SignalTracer**: Signal flow tracing instrument.
- **PerformanceProfiler**: Performance profiling instrument.
- **HealthMonitor**: Health monitoring instrument.

### Theater Terms

- **ComponentCatalogue**: Component inventory with dependencies.
- **Diagram**: Visual documentation (state machines, hierarchies).
- **ReportFormat**: Format for lab reports (text, json, html, markdown).

---

## UI System (Legacy - Being Migrated to Skin)

### Legacy Components (To Be Replaced)

- **VisualNeuron**: Base UI component → **Should be SkinCell**.
- **SensoryNeuron**: Input component → **Should be Receptor**.
- **MotorNeuron**: Action component → **Should be Effector**.
- **InterneuronUI**: Container component → **Should be DermalLayer**.
- **VisualAstrocyte**: UI state management → **Should be Adipocyte**.
- **VisualOligodendrocyte**: UI rendering optimization → **Should be Melanocyte**.

### Generic UI Components (Need Medical Equivalents)

- **Button**: Generic button → **Should be TouchReceptor**.
- **Input**: Generic input → **Should be TextReceptor**.
- **Select**: Generic select → **Needs medical equivalent**.
- **Form**: Generic form → **Should be DermalLayer**.
- **Modal**: Generic modal → **Needs medical equivalent**.
- **Card**: Generic card → **Needs medical equivalent**.
- **Alert**: Generic alert → **Needs medical equivalent**.
- **Text**: Generic text → **Needs medical equivalent**.
- **Radio**: Generic radio → **Needs medical equivalent**.
- **Checkbox**: Generic checkbox → **Needs medical equivalent**.

---

## Visualization System (Needs Medical Equivalents)

### Current Terms (Non-Medical)

- **Chart**: Generic chart → **Needs medical equivalent**.
- **BarChart**: Bar chart → **Needs medical equivalent**.
- **LineChart**: Line chart → **Needs medical equivalent**.
- **PieChart**: Pie chart → **Needs medical equivalent**.
- **ScatterPlot**: Scatter plot → **Needs medical equivalent**.
- **ChartDataPoint**: Data point → **Needs medical equivalent**.
- **DataBounds**: Data bounds → **Needs medical equivalent**.
- **CanvasPoint**: Canvas point → **Needs medical equivalent**.

---

## Infrastructure Terms (Need Medical Equivalents)

### Server/Client Terms

- **Server**: Generic server → **Needs medical equivalent**.
- **Client**: Generic client → **Needs medical equivalent**.
- **Bridge**: Generic bridge → **Needs medical equivalent**.
- **WebSocketBridge**: WebSocket bridge → **Needs medical equivalent**.
- **TheaterServer**: Theater server → **Needs medical equivalent**.
- **HotReload**: Hot reload → **Needs medical equivalent**.

### Configuration Terms

- **Config**: Generic configuration → **Needs medical equivalent**.
- **Options**: Generic options → **Needs medical equivalent**.
- **Settings**: Generic settings → **Needs medical equivalent**.

### Type System Terms (Need Medical Equivalents)

- **ComponentProps**: Component props → **Needs medical equivalent**.
- **ComponentState**: Component state → **Needs medical equivalent**.
- **Props**: Generic props → **Needs medical equivalent**.
- **State**: Generic state → **Needs medical equivalent**.

### Testing Terms (Some Already Medical)

- **Test**: Generic test → **Should use Experiment/Hypothesis**.
- **Mock**: Generic mock → **Needs medical equivalent**.
- **TestSubject**: Already medical ✓.

---

## Communication Terms

- **EventBus**: Event bus → **Needs medical equivalent**.
- **Event**: Generic event → **Needs medical equivalent**.
- **Signal**: Already medical (neural signal) ✓.

---

## Tools Terms (Need Medical Equivalents)

- **DependencyAuditor**: Dependency auditor → **Needs medical equivalent**.
- **AuditReport**: Audit report → **Needs medical equivalent**.
- **AuditOptions**: Audit options → **Needs medical equivalent**.

---

## Naming Conventions

1. **Classes**: PascalCase (e.g., `NeuralNode`, `BloodCell`)
2. **Interfaces**: PascalCase (e.g., `NeuralNodeConfig`, `BloodCellOptions`)
3. **Types**: PascalCase (e.g., `NeuronType`, `NodeState`)
4. **Enums**: PascalCase (e.g., `ProtocolType`, `HealthStatus`)
5. **Methods**: camelCase (e.g., `activate()`, `receive()`)
6. **Variables**: camelCase (e.g., `signalQueue`, `activationTime`)
7. **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `DEFAULT_TTL`)

---

## Status Legend

- ✓ **Approved**: Term is correct and should be used.
- → **Should be**: Term should be replaced with medical equivalent.
- **Needs medical equivalent**: Term needs a medical/biological equivalent to be created.
- **Planned**: Term is planned but not yet implemented.

---

## Notes

1. All terms should align with medical/biological terminology.
2. Legacy terms (VisualNeuron, etc.) should be migrated to Skin system terms.
3. Generic technical terms (Config, Server, Client, etc.) need medical equivalents.
4. UI component names (Button, Input, etc.) need medical equivalents.
5. Visualization terms (Chart, DataPoint, etc.) need medical equivalents.
6. Testing infrastructure terms (Mock, etc.) need medical equivalents.

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Official Domain Terminology Glossary

