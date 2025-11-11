# Prioritized Refactoring Plan

## Overview

This document contains the complete prioritized refactoring plan for aligning the codebase with medical/biological domain terminology.

**Total Changes**: 100+ proposed changes
**High Priority**: 45 changes
**Medium Priority**: 35 changes
**Low Priority**: 20+ changes

---

## High Priority Changes

### 1. UI System Legacy Terms (12 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| VisualNeuron | `src/ui/VisualNeuron.ts`, `src/ui/components/*.ts`, `src/visualization/*.ts` (50+ files) | SkinCell | Per SKIN_WEBNN_ARCHITECTURE.md, VisualNeuron should be SkinCell. This is the base class for all UI components. | High |
| SensoryNeuron | `src/ui/SensoryNeuron.ts`, `src/ui/components/Button.ts`, `src/ui/components/Input.ts`, `src/ui/components/Select.ts`, `src/ui/components/Radio.ts`, `src/ui/components/Checkbox.ts` | Receptor | Per SKIN_WEBNN_ARCHITECTURE.md, SensoryNeuron should be Receptor. Input components detect external stimuli. | High |
| MotorNeuron | `src/ui/MotorNeuron.ts` | Effector | Per SKIN_WEBNN_ARCHITECTURE.md, MotorNeuron should be Effector. Action components produce responses. | High |
| InterneuronUI | `src/ui/InterneuronUI.ts`, `src/ui/components/Form.ts`, `src/ui/components/Modal.ts`, `src/ui/components/Card.ts` | DermalLayer | Per SKIN_WEBNN_ARCHITECTURE.md, InterneuronUI should be DermalLayer. Container components provide structural support. | High |
| VisualAstrocyte | `src/ui/glial/VisualAstrocyte.ts` | Adipocyte | Per SKIN_WEBNN_ARCHITECTURE.md, VisualAstrocyte should be Adipocyte. State storage in skin layer. | High |
| VisualOligodendrocyte | `src/ui/glial/VisualOligodendrocyte.ts` | Melanocyte | Per SKIN_WEBNN_ARCHITECTURE.md, VisualOligodendrocyte should be Melanocyte. Rendering optimization in skin layer. | High |
| ComponentProps | `src/ui/types.ts`, `src/ui/*.ts`, `src/visualization/*.ts` (100+ files) | SkinCellProps / ReceptorProps / EffectorProps / DermalLayerProps | Generic "ComponentProps" should be system-specific. Use SkinCellProps for base, ReceptorProps for inputs, EffectorProps for actions, DermalLayerProps for containers. | High |
| ComponentState | `src/ui/types.ts`, `src/ui/*.ts`, `src/visualization/*.ts` (100+ files) | SkinCellState / ReceptorState / EffectorState / DermalLayerState | Generic "ComponentState" should be system-specific. Use SkinCellState for base, ReceptorState for inputs, EffectorState for actions, DermalLayerState for containers. | High |
| VisualNeuronConfig | `src/ui/VisualNeuron.ts` | SkinCellConfig | Should match SkinCell naming. Configuration for skin cell components. | High |
| Button | `src/ui/components/Button.ts` | TouchReceptor | Already exists in Skin system. Button is a touch/click receptor. | High |
| Input | `src/ui/components/Input.ts` | TextReceptor | Already exists in Skin system. Input is a text receptor. | High |
| TestVisualNeuron | `src/ui/__tests__/VisualNeuron.test.ts` | TestSkinCell | Test class should match production naming. | High |

### 2. Generic UI Component Names (10 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| Select | `src/ui/components/Select.ts` | SelectReceptor / ChoiceReceptor | Needs medical equivalent. Select is a choice receptor. | High |
| Form | `src/ui/components/Form.ts` | DermalLayer | Container component. Form coordinates multiple receptors. | High |
| Modal | `src/ui/components/Modal.ts` | Membrane / Vesicle | Medical term for overlay. Membrane separates spaces, Vesicle contains content. | High |
| Card | `src/ui/components/Card.ts` | DermalLayer / Epidermis | Container component. Card provides structural container. | High |
| Alert | `src/ui/components/Alert.ts` | AlertReceptor / Nociceptor | Medical term for alerts. Nociceptor detects harmful stimuli. | High |
| Text | `src/ui/components/Text.ts` | Keratinocyte / TextCell | Medical term for text display. Keratinocyte is a skin cell that displays content. | High |
| Radio | `src/ui/components/Radio.ts` | RadioReceptor / ChoiceReceptor | Needs medical equivalent. Radio is a choice receptor. | High |
| Checkbox | `src/ui/components/Checkbox.ts` | CheckReceptor / ToggleReceptor | Needs medical equivalent. Checkbox is a toggle receptor. | High |
| ButtonProps | `src/ui/components/Button.ts` | TouchReceptorProps | Should match TouchReceptor naming. | High |
| ButtonState | `src/ui/components/Button.ts` | TouchReceptorState | Should match TouchReceptor naming. | High |

### 3. Visualization Terms (11 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| Chart | `src/visualization/*.ts` (4 files) | Visualization / Graph | Generic "Chart" needs medical equivalent. Visualization is more precise. | High |
| BarChart | `src/visualization/BarChart.ts` | BarVisualization / BarGraph | Needs medical equivalent. Bar visualization. | High |
| LineChart | `src/visualization/LineChart.ts` | LineVisualization / LineGraph | Needs medical equivalent. Line visualization. | High |
| PieChart | `src/visualization/PieChart.ts` | PieVisualization / PieGraph | Needs medical equivalent. Pie visualization. | High |
| ScatterPlot | `src/visualization/ScatterPlot.ts` | ScatterVisualization / ScatterGraph | Needs medical equivalent. Scatter visualization. | High |
| ChartDataPoint | `src/visualization/types.ts` | DataPoint / Measurement | Needs medical equivalent. Data point in visualization. | High |
| DataBounds | `src/visualization/types.ts` | Bounds / Range | Needs medical equivalent. Data bounds for scaling. | High |
| CanvasPoint | `src/visualization/types.ts` | Coordinate / Point | Needs medical equivalent. Canvas coordinate. | High |
| BaseChartProps | `src/visualization/types.ts` | BaseVisualizationProps | Should match Visualization naming. | High |
| BaseChartState | `src/visualization/types.ts` | BaseVisualizationState | Should match Visualization naming. | High |
| ChartTheme | `src/visualization/types.ts` | VisualizationTheme | Should match Visualization naming. | High |

### 4. Infrastructure Terms (6 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| Server | `src/theater/server/TheaterServer.ts` | Organ / System | Medical term for server. Organ performs specific function. | High |
| Client | `src/theater/server/WebSocketBridge.ts` | Receptor / Effector | Medical term for client. Receptor receives, Effector acts. | High |
| Bridge | `src/theater/server/WebSocketBridge.ts` | Synapse / Connection | Medical term for bridge. Synapse connects neurons. | High |
| WebSocketBridge | `src/theater/server/WebSocketBridge.ts` | WebSocketSynapse / WebSocketConnection | Medical term for WebSocket bridge. | High |
| TheaterServer | `src/theater/server/TheaterServer.ts` | TheaterOrgan / TheaterSystem | Medical term for theater server. | High |
| ClientConnection | `src/theater/server/WebSocketBridge.ts` | ReceptorConnection / EffectorConnection | Medical term for client connection. | High |

### 5. Communication Terms (2 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| EventBus | `src/communication/EventBus.ts` | Heart / Artery | Should use Circulatory System terms. Heart is message broker, Artery is outgoing channel. | High |
| Event | `src/types/index.ts`, `src/communication/*.ts` | BloodCell / Signal | Should use medical terminology. BloodCell carries messages, Signal is neural communication. | High |

### 6. Respiratory System Terms (4 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| Router | `src/respiratory/resources/Router.ts` | Bronchus / Trachea | Medical term for routing. Bronchus branches airways, Trachea is main airway. | High |
| Resource | `src/respiratory/resources/Resource.ts` | Oxygen / Nutrient | Medical term for external resources. Oxygen/nutrients are external resources. | High |
| ResourcePool | `src/respiratory/resources/ResourcePool.ts` | Alveolus / Capillary | Medical term for resource pooling. Alveolus exchanges oxygen, Capillary exchanges nutrients. | High |
| Route | `src/respiratory/resources/Route.ts` | Bronchiole | Medical term for routing path. Bronchiole is small airway branch. | High |

---

## Medium Priority Changes

### 7. Configuration Terms (10 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| Config | Throughout codebase (50+ files) | Configuration / Settings | Generic term - needs medical equivalent. Use Configuration for complex configs, Settings for simple configs. | Medium |
| Options | Throughout codebase (50+ files) | Parameters / Settings | Generic term - needs medical equivalent. Use Parameters for function options, Settings for configuration. | Medium |
| Settings | Throughout codebase (20+ files) | Parameters / Configuration | Generic term - needs medical equivalent. | Medium |
| ServerConfig | `src/theater/server/TheaterServer.ts` | OrganConfig / SystemConfig | Medical term for server config. | Medium |
| ServerState | `src/theater/server/TheaterServer.ts` | OrganState / SystemState | Medical term for server state. | Medium |
| WebSocketConfig | `src/theater/server/WebSocketBridge.ts` | WebSocketConnectionConfig | Medical term for WebSocket config. | Medium |
| HotReloadConfig | `src/theater/server/HotReload.ts` | RegenerationConfig | Medical term for hot reload config. | Medium |
| Protocol | `src/types/index.ts`, `src/respiratory/protocols/*.ts` | Bronchus / Trachea | Conflicts with Theater Protocol. Use Bronchus for protocol adapters. | Medium |
| Adapter | `src/respiratory/protocols/ProtocolAdapter.ts` | Bronchus | Medical term for protocol adaptation. | Medium |
| RestAdapter | `src/respiratory/protocols/RestAdapter.ts` | RestBronchus | Medical term for REST adapter. | Medium |

### 8. Respiratory System Resource Terms (5 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| DatabaseResource | `src/respiratory/resources/DatabaseResource.ts` | DatabaseOxygen / DatabaseNutrient | Medical term for database resource. | Medium |
| CacheResource | `src/respiratory/resources/CacheResource.ts` | CacheOxygen / CacheNutrient | Medical term for cache resource. | Medium |
| StorageResource | `src/respiratory/resources/StorageResource.ts` | StorageOxygen / StorageNutrient | Medical term for storage resource. | Medium |
| GraphQLAdapter | `src/respiratory/protocols/GraphQLAdapter.ts` | GraphQLBronchus | Medical term for GraphQL adapter. | Medium |
| WebSocketAdapter | `src/respiratory/protocols/WebSocketAdapter.ts` | WebSocketBronchus | Medical term for WebSocket adapter. | Medium |

### 9. Testing Terms (3 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| Test | Throughout test files (100+ files) | Experiment / Hypothesis | Use medical terms. Experiment for test scenarios, Hypothesis for assertions. | Medium |
| Mock | Throughout test files (50+ files) | Specimen / Model | Medical term for mock. Specimen is test model. | Medium |
| TestInputNeuron | `src/ui/__tests__/SensoryNeuron.test.ts` | TestReceptor | Test class should match production naming. | Medium |

### 10. Tools Terms (3 changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| DependencyAuditor | `src/tools/dependency-auditor.ts` | DependencyAnalyzer / DependencyInspector | Medical term for auditor. Analyzer/Inspector is more medical. | Medium |
| AuditReport | `src/tools/dependency-auditor.ts` | AnalysisReport / InspectionReport | Medical term for audit. Analysis/Inspection is more medical. | Medium |
| AuditOptions | `src/tools/dependency-auditor.ts` | AnalysisOptions / InspectionOptions | Medical term for audit. | Medium |

### 11. Hot Reload Terms (1 change)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| HotReload | `src/theater/server/HotReload.ts` | Regeneration / Renewal | Medical term for hot reload. Regeneration renews cells. | Medium |

### 12. Component Props/State (10+ changes)

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| InputProps | `src/ui/components/Input.ts` | TextReceptorProps | Should match TextReceptor naming. | Medium |
| InputState | `src/ui/components/Input.ts` | TextReceptorState | Should match TextReceptor naming. | Medium |
| SelectProps | `src/ui/components/Select.ts` | SelectReceptorProps | Should match SelectReceptor naming. | Medium |
| SelectState | `src/ui/components/Select.ts` | SelectReceptorState | Should match SelectReceptor naming. | Medium |
| FormProps | `src/ui/components/Form.ts` | DermalLayerProps | Should match DermalLayer naming. | Medium |
| FormState | `src/ui/components/Form.ts` | DermalLayerState | Should match DermalLayer naming. | Medium |
| ModalProps | `src/ui/components/Modal.ts` | MembraneProps / VesicleProps | Should match medical equivalent. | Medium |
| ModalState | `src/ui/components/Modal.ts` | MembraneState / VesicleState | Should match medical equivalent. | Medium |
| CardProps | `src/ui/components/Card.ts` | DermalLayerProps / EpidermisProps | Should match medical equivalent. | Medium |
| CardState | `src/ui/components/Card.ts` | DermalLayerState / EpidermisState | Should match medical equivalent. | Medium |
| AlertProps | `src/ui/components/Alert.ts` | AlertReceptorProps / NociceptorProps | Should match medical equivalent. | Medium |
| AlertState | `src/ui/components/Alert.ts` | AlertReceptorState / NociceptorState | Should match medical equivalent. | Medium |
| TextProps | `src/ui/components/Text.ts` | KeratinocyteProps / TextCellProps | Should match medical equivalent. | Medium |
| TextState | `src/ui/components/Text.ts` | KeratinocyteState / TextCellState | Should match medical equivalent. | Medium |
| RadioProps | `src/ui/components/Radio.ts` | RadioReceptorProps / ChoiceReceptorProps | Should match medical equivalent. | Medium |
| RadioState | `src/ui/components/Radio.ts` | RadioReceptorState / ChoiceReceptorState | Should match medical equivalent. | Medium |
| CheckboxProps | `src/ui/components/Checkbox.ts` | CheckReceptorProps / ToggleReceptorProps | Should match medical equivalent. | Medium |
| CheckboxState | `src/ui/components/Checkbox.ts` | CheckReceptorState / ToggleReceptorState | Should match medical equivalent. | Medium |
| TestSubmitButton | `src/ui/__tests__/MotorNeuron.test.ts` | TestEffector | Test class should match production naming. | Medium |

---

## Low Priority Changes

### 13. Technical Terms (Keep As-Is)

These terms are technical infrastructure terms that may need to remain as-is for compatibility:

- VirtualDOMNode, ComputedStyles, RenderMetadata, UIEventType, PatchOperation, VirtualDOM, AccessibilityNeeds, AccessibilityViolation, RenderMetrics, UserPreferences, LayoutOptimization, UsageMetrics, NavigationGuard, RouteDefinition
- Viewport, IsolationMode, MountedComponent
- WatchPattern, FileChangeEvent, WatchStatistics
- MessageType, WebSocketMessage
- RequestInfo
- Story, StoryObj (Storybook conventions)
- UISignalPayload, SelectOption, RadioOption
- StateSnapshot, StateHistoryEntry, StateChangeCallback, StateMiddleware, Selector
- RenderCacheEntry
- SliceAngle, BarPosition
- And many more technical terms...

**Justification**: These are technical implementation details that don't conflict with the medical metaphor. They can remain as-is.

---

## Summary Statistics

- **Total Changes**: 100+
- **High Priority**: 45 changes
- **Medium Priority**: 35 changes
- **Low Priority**: 20+ changes (mostly keep as-is)

---

**Last Updated**: 2024
**Status**: Prioritized Refactoring Plan

