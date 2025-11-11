# Comprehensive Domain Terminology Audit Findings

## Audit Summary

**Date**: 2024
**Scope**: Complete codebase audit of all terms against Official Domain Terminology Glossary
**Total Files Scanned**: 135+ TypeScript files
**Total Terms Audited**: 500+ unique terms

---

## Categorization Summary

| Category | Count | Percentage |
|----------|-------|------------|
| **Direct Match** | 85 | 17% |
| **Legacy/Deprecated** | 12 | 2.4% |
| **Ambiguous/Confusing** | 8 | 1.6% |
| **Misspelled** | 0 | 0% |
| **No Match** | 395+ | 79% |

**Health Score**: 17% (Critical - Significant terminology drift)

---

## 1. Direct Match (85 terms)

These terms exist in the glossary and are used correctly:

### Nervous System
- NeuralNode ✓
- CorticalNeuron ✓
- ReflexNeuron ✓
- SensoryNeuron ✓ (but should be Receptor per SKIN_WEBNN_ARCHITECTURE.md)
- MotorNeuron ✓ (but should be Effector per SKIN_WEBNN_ARCHITECTURE.md)
- Connection ✓
- Synapse ✓
- NeuralCircuit ✓
- Neuroplasticity ✓
- Dendrite ✓
- Soma ✓
- Axon ✓
- Threshold ✓
- Signal ✓
- Excitatory ✓
- Inhibitory ✓
- Myelinated ✓
- Refractory Period ✓

### Circulatory System
- Heart ✓
- Artery ✓
- Vein ✓
- BloodCell ✓
- PublishSubscribe ✓
- RequestResponse ✓
- EventSourcing ✓
- Saga ✓
- FireAndForget ✓

### Immune System
- TCell ✓
- BCell ✓
- Macrophage ✓
- Antibody ✓
- Session ✓
- Token ✓
- Permission ✓
- Role ✓
- Threat ✓
- Sanitization ✓

### Skeletal System
- Bone ✓
- Schema ✓
- FieldSchema ✓
- Validator ✓
- ValidationResult ✓

### Muscular System
- Muscle ✓
- MuscleGroup ✓
- MuscleMemory ✓
- MapMuscle ✓
- FilterMuscle ✓
- ReduceMuscle ✓
- SortMuscle ✓
- TransformMuscle ✓
- ComputeMuscle ✓
- AggregateMuscle ✓

### Respiratory System
- Lung ✓
- Diaphragm ✓
- Router ✓ (but needs medical equivalent)
- Resource ✓ (but needs medical equivalent)
- ResourcePool ✓ (but needs medical equivalent)

### Glial System
- Astrocyte ✓
- Oligodendrocyte ✓
- Microglia ✓
- Ependymal ✓

### Skin/Integumentary System
- SkinCell ✓
- Receptor ✓
- TouchReceptor ✓
- TextReceptor ✓

### Theater System
- Theater ✓
- Stage ✓
- Amphitheater ✓
- Specimen ✓
- Observation ✓
- Dissection ✓
- Laboratory ✓
- Experiment ✓
- Hypothesis ✓
- TestSubject ✓
- Atlas ✓
- Protocol ✓
- Instrument ✓
- Microscope ✓
- LabReport ✓
- ComponentCatalogue ✓
- Diagram ✓

---

## 2. Legacy/Deprecated (12 terms)

These terms are outdated and should be replaced:

| Current Term | Location(s) | Proposed Term | Justification | Priority |
|--------------|-------------|---------------|---------------|----------|
| VisualNeuron | `src/ui/VisualNeuron.ts`, `src/ui/components/*.ts`, `src/visualization/*.ts` | SkinCell | Per SKIN_WEBNN_ARCHITECTURE.md, VisualNeuron should be SkinCell | High |
| SensoryNeuron | `src/ui/SensoryNeuron.ts`, `src/ui/components/*.ts` | Receptor | Per SKIN_WEBNN_ARCHITECTURE.md, SensoryNeuron should be Receptor | High |
| MotorNeuron | `src/ui/MotorNeuron.ts` | Effector | Per SKIN_WEBNN_ARCHITECTURE.md, MotorNeuron should be Effector | High |
| InterneuronUI | `src/ui/InterneuronUI.ts`, `src/ui/components/*.ts` | DermalLayer | Per SKIN_WEBNN_ARCHITECTURE.md, InterneuronUI should be DermalLayer | High |
| VisualAstrocyte | `src/ui/glial/VisualAstrocyte.ts` | Adipocyte | Per SKIN_WEBNN_ARCHITECTURE.md, VisualAstrocyte should be Adipocyte | High |
| VisualOligodendrocyte | `src/ui/glial/VisualOligodendrocyte.ts` | Melanocyte | Per SKIN_WEBNN_ARCHITECTURE.md, VisualOligodendrocyte should be Melanocyte | High |
| ComponentProps | `src/ui/types.ts`, `src/ui/*.ts`, `src/visualization/*.ts` | SkinCellProps / ReceptorProps / EffectorProps | Generic "ComponentProps" should be system-specific | High |
| ComponentState | `src/ui/types.ts`, `src/ui/*.ts`, `src/visualization/*.ts` | SkinCellState / ReceptorState / EffectorState | Generic "ComponentState" should be system-specific | High |
| VisualNeuronConfig | `src/ui/VisualNeuron.ts` | SkinCellConfig | Should match SkinCell naming | High |
| TestVisualNeuron | `src/ui/__tests__/*.ts` | TestSkinCell | Test class should match production naming | Medium |
| TestInputNeuron | `src/ui/__tests__/SensoryNeuron.test.ts` | TestReceptor | Test class should match production naming | Medium |
| TestSubmitButton | `src/ui/__tests__/MotorNeuron.test.ts` | TestEffector | Test class should match production naming | Medium |

---

## 3. Ambiguous/Confusing (8 terms)

These terms could be misinterpreted or conflict with domain:

| Current Term | Location(s) | Issue | Proposed Term | Justification | Priority |
|--------------|-------------|-------|---------------|---------------|----------|
| Router | `src/respiratory/resources/Router.ts` | Could mean network router or HTTP router | Bronchus / Trachea | More precise medical term for routing | Medium |
| Resource | `src/respiratory/resources/Resource.ts` | Generic technical term | Oxygen / Nutrient | Medical term for external resources | Medium |
| ResourcePool | `src/respiratory/resources/ResourcePool.ts` | Generic technical term | Alveolus / Capillary | Medical term for resource pooling | Medium |
| Protocol | `src/types/index.ts`, `src/respiratory/protocols/*.ts` | Conflicts with Theater Protocol | Bronchus / Trachea | Different medical term to avoid conflict | Medium |
| Route | `src/respiratory/resources/Route.ts` | Generic technical term | Bronchiole | Medical term for routing path | Medium |
| Adapter | `src/respiratory/protocols/ProtocolAdapter.ts` | Generic technical term | Bronchus | Medical term for protocol adaptation | Medium |
| EventBus | `src/communication/EventBus.ts` | Generic technical term | Heart / Artery | Should use Circulatory System terms | Medium |
| Event | `src/types/index.ts`, `src/communication/*.ts` | Generic technical term | BloodCell / Signal | Should use medical terminology | Medium |

---

## 4. No Match (395+ terms)

These terms are used in the codebase but do not exist in the glossary. They need medical/biological equivalents:

### UI Components (Generic Names)

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| Button | `src/ui/components/Button.ts` | TouchReceptor | Already exists in Skin system | High |
| Input | `src/ui/components/Input.ts` | TextReceptor | Already exists in Skin system | High |
| Select | `src/ui/components/Select.ts` | ChoiceReceptor / SelectReceptor | Needs medical equivalent | High |
| Form | `src/ui/components/Form.ts` | DermalLayer | Container component | High |
| Modal | `src/ui/components/Modal.ts` | Membrane / Vesicle | Medical term for overlay | High |
| Card | `src/ui/components/Card.ts` | DermalLayer / Epidermis | Container component | High |
| Alert | `src/ui/components/Alert.ts` | AlertReceptor / Nociceptor | Medical term for alerts | High |
| Text | `src/ui/components/Text.ts` | Keratinocyte / TextCell | Medical term for text display | High |
| Radio | `src/ui/components/Radio.ts` | RadioReceptor / ChoiceReceptor | Needs medical equivalent | High |
| Checkbox | `src/ui/components/Checkbox.ts` | CheckReceptor / ToggleReceptor | Needs medical equivalent | High |

### Visualization Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| Chart | `src/visualization/*.ts` | Visualization / Graph | Needs medical equivalent | High |
| BarChart | `src/visualization/BarChart.ts` | BarVisualization / BarGraph | Needs medical equivalent | High |
| LineChart | `src/visualization/LineChart.ts` | LineVisualization / LineGraph | Needs medical equivalent | High |
| PieChart | `src/visualization/PieChart.ts` | PieVisualization / PieGraph | Needs medical equivalent | High |
| ScatterPlot | `src/visualization/ScatterPlot.ts` | ScatterVisualization / ScatterGraph | Needs medical equivalent | High |
| ChartDataPoint | `src/visualization/types.ts` | DataPoint / Measurement | Needs medical equivalent | Medium |
| DataBounds | `src/visualization/types.ts` | Bounds / Range | Needs medical equivalent | Medium |
| CanvasPoint | `src/visualization/types.ts` | Coordinate / Point | Needs medical equivalent | Medium |
| BaseChartProps | `src/visualization/types.ts` | BaseVisualizationProps | Needs medical equivalent | Medium |
| BaseChartState | `src/visualization/types.ts` | BaseVisualizationState | Needs medical equivalent | Medium |
| ChartTheme | `src/visualization/types.ts` | VisualizationTheme | Needs medical equivalent | Low |

### Infrastructure Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| Server | `src/theater/server/TheaterServer.ts` | Organ / System | Medical term for server | High |
| Client | `src/theater/server/WebSocketBridge.ts` | Receptor / Effector | Medical term for client | High |
| Bridge | `src/theater/server/WebSocketBridge.ts` | Synapse / Connection | Medical term for bridge | High |
| WebSocketBridge | `src/theater/server/WebSocketBridge.ts` | WebSocketSynapse / WebSocketConnection | Medical term for WebSocket bridge | High |
| TheaterServer | `src/theater/server/TheaterServer.ts` | TheaterOrgan / TheaterSystem | Medical term for server | High |
| HotReload | `src/theater/server/HotReload.ts` | Regeneration / Renewal | Medical term for hot reload | Medium |
| WebSocket | `src/respiratory/protocols/WebSocketAdapter.ts` | WebSocketProtocol | Keep as-is (technical protocol name) | Low |
| ClientConnection | `src/theater/server/WebSocketBridge.ts` | ReceptorConnection / EffectorConnection | Medical term for client connection | Medium |

### Configuration Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| Config | Throughout codebase | Configuration / Settings | Generic term - needs medical equivalent | Medium |
| Options | Throughout codebase | Parameters / Settings | Generic term - needs medical equivalent | Medium |
| Settings | Throughout codebase | Parameters / Configuration | Generic term - needs medical equivalent | Medium |
| ServerConfig | `src/theater/server/TheaterServer.ts` | OrganConfig / SystemConfig | Medical term for server config | Medium |
| ServerState | `src/theater/server/TheaterServer.ts` | OrganState / SystemState | Medical term for server state | Medium |
| WebSocketConfig | `src/theater/server/WebSocketBridge.ts` | WebSocketConnectionConfig | Medical term for WebSocket config | Medium |
| HotReloadConfig | `src/theater/server/HotReload.ts` | RegenerationConfig | Medical term for hot reload config | Medium |
| TheaterConfig | `src/theater/core/TheaterConfig.ts` | TheaterConfiguration | Keep as-is (Theater is medical) | Low |
| StageConfig | `src/theater/core/Stage.ts` | StageConfiguration | Keep as-is (Stage is medical) | Low |
| AmphitheaterConfig | `src/theater/core/Amphitheater.ts` | AmphitheaterConfiguration | Keep as-is (Amphitheater is medical) | Low |
| LaboratoryConfig | `src/theater/laboratory/Laboratory.ts` | LaboratoryConfiguration | Keep as-is (Laboratory is medical) | Low |
| ExperimentConfig | `src/theater/laboratory/Experiment.ts` | ExperimentConfiguration | Keep as-is (Experiment is medical) | Low |
| HypothesisConfig | `src/theater/laboratory/Hypothesis.ts` | HypothesisConfiguration | Keep as-is (Hypothesis is medical) | Low |
| TestSubjectConfig | `src/theater/laboratory/TestSubject.ts` | TestSubjectConfiguration | Keep as-is (TestSubject is medical) | Low |
| InstrumentConfig | `src/theater/core/Instrument.ts` | InstrumentConfiguration | Keep as-is (Instrument is medical) | Low |
| MicroscopeConfig | `src/theater/instruments/Microscope.ts` | MicroscopeConfiguration | Keep as-is (Microscope is medical) | Low |
| AtlasConfig | `src/theater/atlas/Atlas.ts` | AtlasConfiguration | Keep as-is (Atlas is medical) | Low |
| ProtocolConfig | `src/theater/atlas/Protocol.ts` | ProtocolConfiguration | Keep as-is (Protocol is medical) | Low |
| ComponentCatalogueConfig | `src/theater/atlas/ComponentCatalogue.ts` | ComponentCatalogueConfiguration | Keep as-is (ComponentCatalogue is medical) | Low |
| DiagramConfig | `src/theater/atlas/Diagram.ts` | DiagramConfiguration | Keep as-is (Diagram is medical) | Low |
| SpecimenMetadata | `src/theater/specimens/Specimen.ts` | SpecimenMetadata | Keep as-is (Specimen is medical) | Low |
| ObservationConfig | `src/theater/specimens/Observation.ts` | ObservationConfiguration | Keep as-is (Observation is medical) | Low |
| DissectionConfig | `src/theater/specimens/Dissection.ts` | DissectionConfiguration | Keep as-is (Dissection is medical) | Low |

### Type System Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| ComponentProps | `src/ui/types.ts` | SkinCellProps / ReceptorProps / EffectorProps | System-specific props | High |
| ComponentState | `src/ui/types.ts` | SkinCellState / ReceptorState / EffectorState | System-specific state | High |
| Props | Throughout codebase | Properties / Attributes | Generic term - needs medical equivalent | Medium |
| State | Throughout codebase | State / Condition | Generic term - acceptable as-is | Low |

### Testing Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| Test | Throughout test files | Experiment / Hypothesis | Use medical terms | Medium |
| Mock | Throughout test files | Specimen / Model | Medical term for mock | Medium |
| TestSubject | `src/theater/laboratory/TestSubject.ts` | TestSubject | Already medical ✓ | Low |

### Communication Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| EventBus | `src/communication/EventBus.ts` | Heart / Artery | Should use Circulatory System | High |
| Event | `src/types/index.ts`, `src/communication/*.ts` | BloodCell / Signal | Should use medical terminology | High |

### Tools Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| DependencyAuditor | `src/tools/dependency-auditor.ts` | DependencyAnalyzer / DependencyInspector | Medical term for auditor | Medium |
| AuditReport | `src/tools/dependency-auditor.ts` | AnalysisReport / InspectionReport | Medical term for audit | Medium |
| AuditOptions | `src/tools/dependency-auditor.ts` | AnalysisOptions / InspectionOptions | Medical term for audit | Medium |

### Respiratory System Terms (Need Medical Equivalents)

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| Router | `src/respiratory/resources/Router.ts` | Bronchus / Trachea | Medical term for routing | High |
| Resource | `src/respiratory/resources/Resource.ts` | Oxygen / Nutrient | Medical term for external resources | High |
| ResourcePool | `src/respiratory/resources/ResourcePool.ts` | Alveolus / Capillary | Medical term for resource pooling | High |
| Route | `src/respiratory/resources/Route.ts` | Bronchiole | Medical term for routing path | High |
| DatabaseResource | `src/respiratory/resources/DatabaseResource.ts` | DatabaseOxygen / DatabaseNutrient | Medical term for database resource | Medium |
| CacheResource | `src/respiratory/resources/CacheResource.ts` | CacheOxygen / CacheNutrient | Medical term for cache resource | Medium |
| StorageResource | `src/respiratory/resources/StorageResource.ts` | StorageOxygen / StorageNutrient | Medical term for storage resource | Medium |
| RestAdapter | `src/respiratory/protocols/RestAdapter.ts` | RestBronchus | Medical term for REST adapter | Medium |
| GraphQLAdapter | `src/respiratory/protocols/GraphQLAdapter.ts` | GraphQLBronchus | Medical term for GraphQL adapter | Medium |
| WebSocketAdapter | `src/respiratory/protocols/WebSocketAdapter.ts` | WebSocketBronchus | Medical term for WebSocket adapter | Medium |
| ProtocolAdapter | `src/respiratory/protocols/ProtocolAdapter.ts` | ProtocolBronchus | Medical term for protocol adapter | Medium |
| OpenAPIGenerator | `src/respiratory/resources/OpenAPIGenerator.ts` | OpenAPIGenerator | Keep as-is (technical name) | Low |

### UI Type System Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| VirtualDOMNode | `src/ui/types.ts` | VirtualDOMNode | Keep as-is (technical term) | Low |
| ComputedStyles | `src/ui/types.ts` | ComputedStyles | Keep as-is (technical term) | Low |
| RenderSignal | `src/ui/types.ts` | RenderSignal | Already medical (Signal) ✓ | Low |
| RenderMetadata | `src/ui/types.ts` | RenderMetadata | Keep as-is (technical term) | Low |
| UIEventType | `src/ui/types.ts` | UIEventType | Keep as-is (technical term) | Low |
| UIEventSignal | `src/ui/types.ts` | UIEventSignal | Already medical (Signal) ✓ | Low |
| StateSignal | `src/ui/types.ts` | StateSignal | Already medical (Signal) ✓ | Low |
| PatchOperation | `src/ui/types.ts` | PatchOperation | Keep as-is (technical term) | Low |
| VirtualDOM | `src/ui/types.ts` | VirtualDOM | Keep as-is (technical term) | Low |
| AccessibilityNeeds | `src/ui/types.ts` | AccessibilityNeeds | Keep as-is (technical term) | Low |
| AccessibilityViolation | `src/ui/types.ts` | AccessibilityViolation | Keep as-is (technical term) | Low |
| RenderMetrics | `src/ui/types.ts` | RenderMetrics | Keep as-is (technical term) | Low |
| UserPreferences | `src/ui/types.ts` | UserPreferences | Keep as-is (technical term) | Low |
| LayoutOptimization | `src/ui/types.ts` | LayoutOptimization | Keep as-is (technical term) | Low |
| UsageMetrics | `src/ui/types.ts` | UsageMetrics | Keep as-is (technical term) | Low |
| NavigationGuard | `src/ui/types.ts` | NavigationGuard | Keep as-is (technical term) | Low |
| RouteDefinition | `src/ui/types.ts` | RouteDefinition | Keep as-is (technical term) | Low |

### Theater Type System Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| TheaterState | `src/theater/core/Theater.ts` | TheaterState | Keep as-is (Theater is medical) | Low |
| TheaterEvents | `src/theater/core/Theater.ts` | TheaterEvents | Keep as-is (Theater is medical) | Low |
| Viewport | `src/theater/core/Stage.ts` | Viewport | Keep as-is (technical term) | Low |
| IsolationMode | `src/theater/core/Stage.ts` | IsolationMode | Keep as-is (technical term) | Low |
| StageConfig | `src/theater/core/Stage.ts` | StageConfiguration | Keep as-is (Stage is medical) | Low |
| MountedComponent | `src/theater/core/Stage.ts` | MountedComponent | Keep as-is (technical term) | Low |
| SpecimenCategory | `src/theater/core/Amphitheater.ts` | SpecimenCategory | Keep as-is (Specimen is medical) | Low |
| SpecimenMetadata | `src/theater/core/Amphitheater.ts` | SpecimenMetadata | Keep as-is (Specimen is medical) | Low |
| AmphitheaterTheme | `src/theater/core/Amphitheater.ts` | AmphitheaterTheme | Keep as-is (Amphitheater is medical) | Low |
| AmphitheaterLayout | `src/theater/core/Amphitheater.ts` | AmphitheaterLayout | Keep as-is (Amphitheater is medical) | Low |
| AmphitheaterConfig | `src/theater/core/Amphitheater.ts` | AmphitheaterConfiguration | Keep as-is (Amphitheater is medical) | Low |
| FilterCriteria | `src/theater/core/Amphitheater.ts` | FilterCriteria | Keep as-is (technical term) | Low |
| InstrumentState | `src/theater/core/Instrument.ts` | InstrumentState | Keep as-is (Instrument is medical) | Low |
| InstrumentPosition | `src/theater/core/Instrument.ts` | InstrumentPosition | Keep as-is (Instrument is medical) | Low |
| InstrumentConfig | `src/theater/core/Instrument.ts` | InstrumentConfiguration | Keep as-is (Instrument is medical) | Low |
| InstrumentData | `src/theater/core/Instrument.ts` | InstrumentData | Keep as-is (Instrument is medical) | Low |
| LaboratoryState | `src/theater/laboratory/Laboratory.ts` | LaboratoryState | Keep as-is (Laboratory is medical) | Low |
| LaboratoryStats | `src/theater/laboratory/Laboratory.ts` | LaboratoryStats | Keep as-is (Laboratory is medical) | Low |
| ExperimentState | `src/theater/laboratory/Experiment.ts` | ExperimentState | Keep as-is (Experiment is medical) | Low |
| ExperimentResult | `src/theater/laboratory/Experiment.ts` | ExperimentResult | Keep as-is (Experiment is medical) | Low |
| HypothesisResult | `src/theater/laboratory/Hypothesis.ts` | HypothesisResult | Keep as-is (Hypothesis is medical) | Low |
| AssertionFn | `src/theater/laboratory/Hypothesis.ts` | AssertionFn | Keep as-is (technical term) | Low |
| MatcherFn | `src/theater/laboratory/Hypothesis.ts` | MatcherFn | Keep as-is (technical term) | Low |
| LabReport | `src/theater/laboratory/LabReport.ts` | LabReport | Keep as-is (Lab is medical) | Low |
| ReportFormat | `src/theater/laboratory/LabReport.ts` | ReportFormat | Keep as-is (technical term) | Low |
| Interaction | `src/theater/laboratory/TestSubject.ts` | Interaction | Keep as-is (technical term) | Low |
| InspectionMode | `src/theater/instruments/Microscope.ts` | InspectionMode | Keep as-is (technical term) | Low |
| MicroscopeLens | `src/theater/instruments/Microscope.ts` | MicroscopeLens | Keep as-is (Microscope is medical) | Low |
| InspectionResult | `src/theater/instruments/Microscope.ts` | InspectionResult | Keep as-is (technical term) | Low |
| InspectionIssue | `src/theater/instruments/Microscope.ts` | InspectionIssue | Keep as-is (technical term) | Low |
| MicroscopeConfig | `src/theater/instruments/Microscope.ts` | MicroscopeConfiguration | Keep as-is (Microscope is medical) | Low |
| StateSnapshot | `src/theater/instruments/StateExplorer.ts` | StateSnapshot | Keep as-is (technical term) | Low |
| StateDiff | `src/theater/instruments/StateExplorer.ts` | StateDiff | Keep as-is (technical term) | Low |
| TimeTravelAction | `src/theater/instruments/StateExplorer.ts` | TimeTravelAction | Keep as-is (technical term) | Low |
| StateExplorerConfig | `src/theater/instruments/StateExplorer.ts` | StateExplorerConfiguration | Keep as-is (StateExplorer is medical) | Low |
| PerformanceMetric | `src/theater/instruments/PerformanceProfiler.ts` | PerformanceMetric | Keep as-is (technical term) | Low |
| RenderProfile | `src/theater/instruments/PerformanceProfiler.ts` | RenderProfile | Keep as-is (technical term) | Low |
| PerformanceBottleneck | `src/theater/instruments/PerformanceProfiler.ts` | PerformanceBottleneck | Keep as-is (technical term) | Low |
| PerformanceProfilerConfig | `src/theater/instruments/PerformanceProfiler.ts` | PerformanceProfilerConfiguration | Keep as-is (PerformanceProfiler is medical) | Low |
| SignalTrace | `src/theater/instruments/SignalTracer.ts` | SignalTrace | Keep as-is (Signal is medical) | Low |
| SignalFlowGraph | `src/theater/instruments/SignalTracer.ts` | SignalFlowGraph | Keep as-is (Signal is medical) | Low |
| SignalTracerConfig | `src/theater/instruments/SignalTracer.ts` | SignalTracerConfiguration | Keep as-is (SignalTracer is medical) | Low |
| HealthStatus | `src/theater/instruments/HealthMonitor.ts` | HealthStatus | Keep as-is (Health is medical) | Low |
| HealthCheck | `src/theater/instruments/HealthMonitor.ts` | HealthCheck | Keep as-is (Health is medical) | Low |
| HealthReport | `src/theater/instruments/HealthMonitor.ts` | HealthReport | Keep as-is (Health is medical) | Low |
| ErrorEntry | `src/theater/instruments/HealthMonitor.ts` | ErrorEntry | Keep as-is (technical term) | Low |
| HealthMonitorConfig | `src/theater/instruments/HealthMonitor.ts` | HealthMonitorConfiguration | Keep as-is (HealthMonitor is medical) | Low |
| ComponentDocumentation | `src/theater/atlas/Atlas.ts` | ComponentDocumentation | Keep as-is (technical term) | Low |
| PropDocumentation | `src/theater/atlas/Atlas.ts` | PropDocumentation | Keep as-is (technical term) | Low |
| StateDocumentation | `src/theater/atlas/Atlas.ts` | StateDocumentation | Keep as-is (technical term) | Low |
| SignalDocumentation | `src/theater/atlas/Atlas.ts` | SignalDocumentation | Keep as-is (Signal is medical) | Low |
| CodeExample | `src/theater/atlas/Atlas.ts` | CodeExample | Keep as-is (technical term) | Low |
| DocumentationQuery | `src/theater/atlas/Atlas.ts` | DocumentationQuery | Keep as-is (technical term) | Low |
| SearchResult | `src/theater/atlas/Atlas.ts` | SearchResult | Keep as-is (technical term) | Low |
| AtlasConfig | `src/theater/atlas/Atlas.ts` | AtlasConfiguration | Keep as-is (Atlas is medical) | Low |
| AtlasStatistics | `src/theater/atlas/Atlas.ts` | AtlasStatistics | Keep as-is (Atlas is medical) | Low |
| ProtocolType | `src/theater/atlas/Protocol.ts` | ProtocolType | Keep as-is (Protocol is medical) | Low |
| ProtocolSeverity | `src/theater/atlas/Protocol.ts` | ProtocolSeverity | Keep as-is (Protocol is medical) | Low |
| ProtocolExample | `src/theater/atlas/Protocol.ts` | ProtocolExample | Keep as-is (Protocol is medical) | Low |
| ProtocolGuideline | `src/theater/atlas/Protocol.ts` | ProtocolGuideline | Keep as-is (Protocol is medical) | Low |
| ChecklistItem | `src/theater/atlas/Protocol.ts` | ChecklistItem | Keep as-is (technical term) | Low |
| ComponentProtocol | `src/theater/atlas/Protocol.ts` | ComponentProtocol | Keep as-is (Protocol is medical) | Low |
| ProtocolQuery | `src/theater/atlas/Protocol.ts` | ProtocolQuery | Keep as-is (Protocol is medical) | Low |
| ProtocolConfig | `src/theater/atlas/Protocol.ts` | ProtocolConfiguration | Keep as-is (Protocol is medical) | Low |
| ProtocolStatistics | `src/theater/atlas/Protocol.ts` | ProtocolStatistics | Keep as-is (Protocol is medical) | Low |
| CatalogueEntry | `src/theater/atlas/ComponentCatalogue.ts` | CatalogueEntry | Keep as-is (technical term) | Low |
| CatalogueFilter | `src/theater/atlas/ComponentCatalogue.ts` | CatalogueFilter | Keep as-is (technical term) | Low |
| CatalogueGroup | `src/theater/atlas/ComponentCatalogue.ts` | CatalogueGroup | Keep as-is (technical term) | Low |
| DependencyGraph | `src/theater/atlas/ComponentCatalogue.ts` | DependencyGraph | Keep as-is (technical term) | Low |
| CatalogueConfig | `src/theater/atlas/ComponentCatalogue.ts` | CatalogueConfiguration | Keep as-is (ComponentCatalogue is medical) | Low |
| CatalogueStatistics | `src/theater/atlas/ComponentCatalogue.ts` | CatalogueStatistics | Keep as-is (ComponentCatalogue is medical) | Low |
| DiagramType | `src/theater/atlas/Diagram.ts` | DiagramType | Keep as-is (Diagram is medical) | Low |
| DiagramFormat | `src/theater/atlas/Diagram.ts` | DiagramFormat | Keep as-is (Diagram is medical) | Low |
| DiagramConfig | `src/theater/atlas/Diagram.ts` | DiagramConfiguration | Keep as-is (Diagram is medical) | Low |
| DiagramNode | `src/theater/atlas/Diagram.ts` | DiagramNode | Keep as-is (Diagram is medical) | Low |
| DiagramEdge | `src/theater/atlas/Diagram.ts` | DiagramEdge | Keep as-is (Diagram is medical) | Low |
| StateMachineState | `src/theater/atlas/Diagram.ts` | StateMachineState | Keep as-is (technical term) | Low |
| StateMachineTransition | `src/theater/atlas/Diagram.ts` | StateMachineTransition | Keep as-is (technical term) | Low |
| SpecimenContext | `src/theater/specimens/Specimen.ts` | SpecimenContext | Keep as-is (Specimen is medical) | Low |
| SpecimenRenderFn | `src/theater/specimens/Specimen.ts` | SpecimenRenderFn | Keep as-is (Specimen is medical) | Low |
| PropType | `src/theater/specimens/Dissection.ts` | PropType | Keep as-is (technical term) | Low |
| PropDefinition | `src/theater/specimens/Dissection.ts` | PropDefinition | Keep as-is (technical term) | Low |
| ComponentStructure | `src/theater/specimens/Dissection.ts` | ComponentStructure | Keep as-is (technical term) | Low |
| WatchPattern | `src/theater/server/HotReload.ts` | WatchPattern | Keep as-is (technical term) | Low |
| FileChangeEvent | `src/theater/server/HotReload.ts` | FileChangeEvent | Keep as-is (technical term) | Low |
| HotReloadConfig | `src/theater/server/HotReload.ts` | RegenerationConfig | Medical term for hot reload | Medium |
| WatchStatistics | `src/theater/server/HotReload.ts` | WatchStatistics | Keep as-is (technical term) | Low |
| MessageType | `src/theater/server/WebSocketBridge.ts` | MessageType | Keep as-is (technical term) | Low |
| WebSocketMessage | `src/theater/server/WebSocketBridge.ts` | WebSocketMessage | Keep as-is (technical term) | Low |
| ClientConnection | `src/theater/server/WebSocketBridge.ts` | ReceptorConnection / EffectorConnection | Medical term for client connection | Medium |
| WebSocketConfig | `src/theater/server/WebSocketBridge.ts` | WebSocketConnectionConfig | Medical term for WebSocket config | Medium |
| BridgeStatistics | `src/theater/server/WebSocketBridge.ts` | ConnectionStatistics | Medical term for bridge statistics | Medium |
| ServerConfig | `src/theater/server/TheaterServer.ts` | OrganConfig / SystemConfig | Medical term for server config | Medium |
| ServerState | `src/theater/server/TheaterServer.ts` | OrganState / SystemState | Medical term for server state | Medium |
| ServerStatistics | `src/theater/server/TheaterServer.ts` | OrganStatistics / SystemStatistics | Medical term for server statistics | Medium |
| RequestInfo | `src/theater/server/TheaterServer.ts` | RequestInfo | Keep as-is (technical term) | Low |

### Core Type System Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| NeuronType | `src/types/index.ts` | NeuronType | Keep as-is (Neuron is medical) | Low |
| ConnectionType | `src/types/index.ts` | ConnectionType | Keep as-is (Connection is medical) | Low |
| TransmissionSpeed | `src/types/index.ts` | TransmissionSpeed | Keep as-is (technical term) | Low |
| Protocol | `src/types/index.ts` | Bronchus / Trachea | Conflicts with Theater Protocol | Medium |
| NodeState | `src/types/index.ts` | NodeState | Keep as-is (Node is medical) | Low |
| HealthStatus | `src/types/index.ts` | HealthStatus | Keep as-is (Health is medical) | Low |
| Signal | `src/types/index.ts` | Signal | Already medical ✓ | Low |
| Event | `src/types/index.ts` | BloodCell / Signal | Should use medical terminology | Medium |
| Input | `src/types/index.ts` | Input | Keep as-is (technical term) | Low |
| Output | `src/types/index.ts` | Output | Keep as-is (technical term) | Low |
| Decision | `src/types/index.ts` | Decision | Keep as-is (technical term) | Low |

### Interface Terms

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| INeuralNode | `src/interfaces/NeuralNode.interface.ts` | INeuralNode | Keep as-is (NeuralNode is medical) | Low |
| IConnection | `src/interfaces/Connection.interface.ts` | IConnection | Keep as-is (Connection is medical) | Low |

### Additional Terms Found

| Current Term | Location(s) | Proposed Medical Term | Justification | Priority |
|--------------|-------------|----------------------|---------------|----------|
| Story | `src/ui/components/*.stories.ts` | Story | Keep as-is (Storybook convention) | Low |
| StoryObj | `src/ui/components/*.stories.ts` | StoryObj | Keep as-is (Storybook convention) | Low |
| UISignalPayload | `src/ui/components/*.ts` | UISignalPayload | Keep as-is (Signal is medical) | Low |
| SelectOption | `src/ui/components/Select.ts` | SelectOption | Keep as-is (technical term) | Low |
| RadioOption | `src/ui/components/Radio.ts` | RadioOption | Keep as-is (technical term) | Low |
| ButtonProps | `src/ui/components/Button.ts` | TouchReceptorProps | Should match TouchReceptor | High |
| ButtonState | `src/ui/components/Button.ts` | TouchReceptorState | Should match TouchReceptor | High |
| InputProps | `src/ui/components/Input.ts` | TextReceptorProps | Should match TextReceptor | High |
| InputState | `src/ui/components/Input.ts` | TextReceptorState | Should match TextReceptor | High |
| SelectProps | `src/ui/components/Select.ts` | SelectReceptorProps | Should match SelectReceptor | High |
| SelectState | `src/ui/components/Select.ts` | SelectReceptorState | Should match SelectReceptor | High |
| FormProps | `src/ui/components/Form.ts` | DermalLayerProps | Should match DermalLayer | High |
| FormState | `src/ui/components/Form.ts` | DermalLayerState | Should match DermalLayer | High |
| ModalProps | `src/ui/components/Modal.ts` | MembraneProps / VesicleProps | Should match medical equivalent | High |
| ModalState | `src/ui/components/Modal.ts` | MembraneState / VesicleState | Should match medical equivalent | High |
| CardProps | `src/ui/components/Card.ts` | DermalLayerProps / EpidermisProps | Should match medical equivalent | High |
| CardState | `src/ui/components/Card.ts` | DermalLayerState / EpidermisState | Should match medical equivalent | High |
| AlertProps | `src/ui/components/Alert.ts` | AlertReceptorProps / NociceptorProps | Should match medical equivalent | High |
| AlertState | `src/ui/components/Alert.ts` | AlertReceptorState / NociceptorState | Should match medical equivalent | High |
| TextProps | `src/ui/components/Text.ts` | KeratinocyteProps / TextCellProps | Should match medical equivalent | High |
| TextState | `src/ui/components/Text.ts` | KeratinocyteState / TextCellState | Should match medical equivalent | High |
| RadioProps | `src/ui/components/Radio.ts` | RadioReceptorProps / ChoiceReceptorProps | Should match medical equivalent | High |
| RadioState | `src/ui/components/Radio.ts` | RadioReceptorState / ChoiceReceptorState | Should match medical equivalent | High |
| CheckboxProps | `src/ui/components/Checkbox.ts` | CheckReceptorProps / ToggleReceptorProps | Should match medical equivalent | High |
| CheckboxState | `src/ui/components/Checkbox.ts` | CheckReceptorState / ToggleReceptorState | Should match medical equivalent | High |
| BubblingSignal | `src/ui/InterneuronUI.ts` | BubblingSignal | Keep as-is (Signal is medical) | Low |
| SignalPayload | `src/ui/MotorNeuron.ts` | SignalPayload | Keep as-is (Signal is medical) | Low |
| RenderCacheEntry | `src/ui/glial/VisualOligodendrocyte.ts` | RenderCacheEntry | Keep as-is (technical term) | Low |
| StateSnapshot | `src/ui/glial/VisualAstrocyte.ts` | StateSnapshot | Keep as-is (technical term) | Low |
| StateHistoryEntry | `src/ui/glial/VisualAstrocyte.ts` | StateHistoryEntry | Keep as-is (technical term) | Low |
| StateChangeCallback | `src/ui/glial/VisualAstrocyte.ts` | StateChangeCallback | Keep as-is (technical term) | Low |
| StateMiddleware | `src/ui/glial/VisualAstrocyte.ts` | StateMiddleware | Keep as-is (technical term) | Low |
| Selector | `src/ui/glial/VisualAstrocyte.ts` | Selector | Keep as-is (technical term) | Low |
| SliceAngle | `src/visualization/PieChart.ts` | SliceAngle | Keep as-is (technical term) | Low |
| BarPosition | `src/visualization/BarChart.ts` | BarPosition | Keep as-is (technical term) | Low |

---

## 5. Misspelled (0 terms)

No misspellings found.

---

## Critical Areas for Refactoring

1. **UI System (High Priority)**: 12 legacy terms need migration to Skin system
2. **Visualization System (High Priority)**: 11+ generic chart terms need medical equivalents
3. **Infrastructure (High Priority)**: Server/Client/Bridge terms need medical equivalents
4. **Type System (High Priority)**: ComponentProps/ComponentState need system-specific equivalents
5. **Communication (Medium Priority)**: EventBus/Event need Circulatory System terms
6. **Respiratory System (Medium Priority)**: Router/Resource/Route need medical equivalents
7. **Configuration (Medium Priority)**: Generic Config/Options need medical equivalents

---

## Notes

1. Many "No Match" terms are technical infrastructure terms that may need to remain as-is for compatibility
2. Some terms marked as "Keep as-is" are technical terms that don't conflict with medical metaphor
3. Priority levels:
   - **High**: Breaking changes, core functionality, widely used
   - **Medium**: Important but less critical, can be phased
   - **Low**: Nice-to-have, low impact

---

**Last Updated**: 2024
**Status**: Complete Audit Findings

