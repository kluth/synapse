# Refined Issue Specification: QuantumAssembly Component

---

## 1. Initial Issue Analysis

> **Original Issue (Fetched):** 
> - **Number:** #216
> - **Title:** UI Component: QuantumAssembly - Multi-path Production Planning
> - **Body:** 
>   - Component Name: QuantumAssembly
>   - Category: Manufacturing
>   - Description: Assembly planner showing quantum production paths for optimal efficiency.
>   - Key Features:
>     - Quantum production paths
>     - Resource allocation
>     - Sequence optimization
>     - Bottleneck analysis
>     - Change management
>     - Version control
>     - Cost tracking
>     - Time studies
>     - Capacity planning
>     - Simulation tools

> **Core Problem:** 
> Manufacturing teams need a visual interface to explore multiple production path scenarios simultaneously, allowing them to compare different assembly sequences, resource allocations, and optimization strategies to make data-driven decisions about production planning.

> **Critical Assumptions Made:**
> - Assuming this is a client-side UI component built with the Synapse framework's VisualNeuron architecture
> - Assuming "quantum" refers to the ability to visualize and compare multiple parallel production scenarios simultaneously (not actual quantum computing)
> - Assuming the component will receive production data via props (not directly querying a backend)
> - Assuming the component needs to be interactive, allowing users to select, compare, and manipulate different production paths
> - Assuming "optimal efficiency" means the component should calculate and display metrics like time, cost, and resource utilization
> - Assuming the component should support real-time updates when production data changes
> - Assuming the component will integrate with the Theater system for development and testing
> - Assuming TypeScript is the implementation language
> - Assuming the component should follow TDD methodology with comprehensive test coverage
> - Assuming the component should handle edge cases like empty data, invalid inputs, and loading states
> - Assuming the component should emit neural signals for integration with other components in the Synapse ecosystem

---

## 2. Refined Issue Specification

> **Refined Title:** 
> Implement QuantumAssembly Component: Interactive Multi-Path Production Planning Interface

> **Refined Description:**
> 
> Create a TypeScript UI component `QuantumAssembly` that extends `VisualNeuron` to provide an interactive production planning interface. The component must:
> 
> **Core Functionality:**
> 1. **Multi-Path Visualization:** Display multiple production path scenarios simultaneously in a visual format (e.g., Gantt-like timeline, flow diagram, or parallel path view)
> 2. **Path Comparison:** Allow users to select and compare 2-4 production paths side-by-side with key metrics (duration, cost, resource usage)
> 3. **Interactive Path Selection:** Enable users to click on paths to view detailed information and select paths for comparison
> 4. **Resource Allocation Display:** Show resource requirements (machines, workers, materials) for each path with capacity indicators
> 5. **Bottleneck Identification:** Visually highlight bottlenecks (resource constraints, critical path delays) in each production path
> 6. **Metric Calculation:** Calculate and display key metrics for each path:
>    - Total duration
>    - Total cost
>    - Resource utilization percentage
>    - Efficiency score
> 
> **Data Structure:**
> - Component accepts production path data via props
> - Each production path contains: sequence of operations, resource requirements, time estimates, cost estimates
> - Component maintains internal state for: selected paths, view mode, filter criteria
> 
> **User Interactions:**
> - Click path to select/deselect for comparison
> - Hover to see detailed metrics
> - Toggle between different visualization modes (timeline, flow, metrics table)
> - Filter paths by criteria (duration, cost, resource type)
> 
> **Technical Requirements:**
> - Extends `VisualNeuron<QuantumAssemblyProps, QuantumAssemblyState>`
> - Implements proper TypeScript types for all props and state
> - Emits neural signals for path selection, comparison, and metric changes
> - Handles loading states, empty data, and error conditions
> - Responsive design considerations
> - Accessible (keyboard navigation, ARIA labels)
> 
> **Out of Scope (for initial implementation):**
> - Actual production path optimization algorithms (assume paths are provided)
> - Backend API integration (data comes via props)
> - Real-time collaboration features
> - Export/import functionality
> - Advanced simulation capabilities beyond basic metric calculation
> - Change management and version control UI (separate components)

---

## 3. Key Use Cases & User Stories

> * **As a** production planner, **I want to** view multiple production path scenarios simultaneously, **so that** I can quickly compare different assembly strategies without switching between views.

> * **As a** manufacturing manager, **I want to** see resource allocation for each production path, **so that** I can identify which paths are feasible given current resource constraints.

> * **As a** operations analyst, **I want to** identify bottlenecks in production paths visually, **so that** I can focus optimization efforts on critical constraints.

> * **As a** cost analyst, **I want to** compare cost estimates across different production paths, **so that** I can recommend the most cost-effective assembly strategy.

> * **As a** production scheduler, **I want to** see time estimates for each path, **so that** I can plan production schedules and meet delivery deadlines.

> * **As a** system integrator, **I want to** receive neural signals when paths are selected or compared, **so that** other components in the application can react to user interactions.

---

## 4. Acceptance Criteria & TDD Scenarios

> **Acceptance Criteria:**
> - Component renders without errors when provided valid production path data
> - Component displays all provided production paths in a visual format
> - Users can select up to 4 paths for comparison
> - Selected paths are visually distinct from unselected paths
> - Component calculates and displays metrics (duration, cost, resource utilization) for each path
> - Component highlights bottlenecks (resource constraints, critical path delays)
> - Component handles empty data gracefully (shows empty state message)
> - Component handles invalid data gracefully (shows error message)
> - Component emits neural signals when paths are selected/deselected
> - Component emits neural signals when comparison metrics change
> - Component supports keyboard navigation for accessibility
> - All public methods and props have proper TypeScript types
> - Component has comprehensive test coverage (>90%)

> **Scenario 1 (Happy Path - Rendering Multiple Paths):**
>     * **Given:** Component receives props with 3 valid production paths, each containing operations, resources, time, and cost data
>     * **When:** Component is rendered
>     * **Then:** All 3 paths are displayed visually, each path shows its operations in sequence, and basic metrics (duration, cost) are visible for each path

> **Scenario 2 (Happy Path - Path Selection):**
>     * **Given:** Component is rendered with 5 production paths, no paths are currently selected
>     * **When:** User clicks on path #2, then clicks on path #4
>     * **Then:** Paths #2 and #4 are visually highlighted as selected, comparison metrics are displayed, and neural signals are emitted for both selection events

> **Scenario 3 (Happy Path - Path Comparison):**
>     * **Given:** Component has 2 paths selected (paths #1 and #3)
>     * **When:** Component calculates comparison metrics
>     * **Then:** Side-by-side comparison view shows duration, cost, resource utilization, and efficiency score for both paths, with differences highlighted

> **Scenario 4 (Edge Case - Empty Data):**
>     * **Given:** Component receives props with empty or null production paths array
>     * **When:** Component is rendered
>     * **Then:** Component displays an empty state message (e.g., "No production paths available") and does not throw errors

> **Scenario 5 (Edge Case - Invalid Path Data):**
>     * **Given:** Component receives props with a production path missing required fields (e.g., no operations array, missing time estimates)
>     * **When:** Component attempts to render the invalid path
>     * **Then:** Component either skips the invalid path with a warning or displays an error indicator for that specific path, without breaking the entire component

> **Scenario 6 (Edge Case - Maximum Selection Limit):**
>     * **Given:** Component has 4 paths already selected (maximum limit)
>     * **When:** User attempts to select a 5th path
>     * **Then:** The 5th path is not selected, and either a visual indicator or message informs the user that the maximum selection limit has been reached

> **Scenario 7 (Edge Case - Single Path):**
>     * **Given:** Component receives props with only 1 production path
>     * **When:** Component is rendered
>     * **Then:** The single path is displayed with full details, and selection/comparison UI is still functional (though comparison may show "N/A" or be disabled)

> **Scenario 8 (Error State - Missing Required Props):**
>     * **Given:** Component is instantiated without required props (e.g., missing `paths` prop)
>     * **When:** Component attempts to initialize
>     * **Then:** Component either uses default empty state or throws a clear error message indicating missing required props

> **Scenario 9 (Interaction - Hover Details):**
>     * **Given:** Component is rendered with multiple paths
>     * **When:** User hovers over a production path
>     * **Then:** A tooltip or detail panel appears showing expanded metrics (detailed resource breakdown, operation sequence, cost breakdown)

> **Scenario 10 (Interaction - Bottleneck Highlighting):**
>     * **Given:** Component has a production path with a bottleneck (e.g., a resource that is over-allocated or a critical path delay)
>     * **When:** Component calculates and renders the path
>     * **Then:** The bottleneck is visually highlighted (e.g., red indicator, warning icon) and tooltip explains the bottleneck issue

> **Scenario 11 (State Management - Path Deselection):**
>     * **Given:** Component has 3 paths selected (paths #1, #2, #3)
>     * **When:** User clicks on already-selected path #2
>     * **Then:** Path #2 is deselected (visual highlight removed), comparison updates to show only paths #1 and #3, and neural signal is emitted for deselection

> **Scenario 12 (Metric Calculation - Resource Utilization):**
>     * **Given:** Component receives a production path with resource requirements: Machine A (needed 8 hours, available 10 hours), Machine B (needed 12 hours, available 10 hours)
>     * **When:** Component calculates resource utilization
>     * **Then:** Machine A shows 80% utilization (normal), Machine B shows 120% utilization (over-allocated/bottleneck), and this is reflected in the visualization

---

## 5. Implementation Plan for Developer Agent

> **Task:** Implement the QuantumAssembly component as defined in the specification above.

> **Language:** TypeScript

> **Methodology:** TDD (Test-Driven Development)

> **Step-by-Step Plan:**

> 1. **Setup:** 
>    - Create file structure: `src/ui/components/QuantumAssembly/QuantumAssembly.ts`, `src/ui/components/QuantumAssembly/QuantumAssembly.test.ts`, `src/ui/components/QuantumAssembly/index.ts`
>    - Define TypeScript interfaces: `QuantumAssemblyProps`, `QuantumAssemblyState`, `ProductionPath`, `Operation`, `ResourceRequirement`, `PathMetrics`
>    - Import necessary dependencies: `VisualNeuron`, `RenderSignal`, `UIEventSignal` from appropriate modules

> 2. **Test 1 (Scenario 4 - Empty Data):** 
>    - Write failing test in `QuantumAssembly.test.ts`: Component renders empty state message when provided empty paths array
>    - Assert: Component renders without errors, displays empty state message

> 3. **Implement 1:** 
>    - Create `QuantumAssembly` class extending `VisualNeuron<QuantumAssemblyProps, QuantumAssemblyState>`
>    - Implement basic constructor with empty state handling
>    - Implement `performRender()` to return empty state message when paths array is empty
>    - Make Test 1 pass

> 4. **Refactor 1:** 
>    - Extract empty state message to constant
>    - Ensure proper TypeScript types

> 5. **Test 2 (Scenario 1 - Rendering Multiple Paths):** 
>    - Write failing test: Component renders 3 valid production paths with basic visualization
>    - Assert: All 3 paths are rendered, each shows operations sequence, basic metrics visible

> 6. **Implement 2:** 
>    - Implement path data structure parsing
>    - Implement basic path visualization in `performRender()` (start with simple list/table view)
>    - Calculate and display basic metrics (duration, cost) for each path
>    - Make Test 2 pass

> 7. **Refactor 2:** 
>    - Extract metric calculation logic to private method `calculatePathMetrics(path: ProductionPath): PathMetrics`
>    - Extract path rendering logic to private method `renderPath(path: ProductionPath, index: number): VDOMNode`

> 8. **Test 3 (Scenario 2 - Path Selection):** 
>    - Write failing test: User can select paths by clicking, selected paths are visually distinct, neural signals are emitted
>    - Assert: Click handler updates state, selected paths have different styling, `emitUIEvent` is called with correct signal data

> 9. **Implement 3:** 
>    - Add `selectedPathIds: string[]` to component state
>    - Implement `handlePathClick(pathId: string)` method
>    - Update `performRender()` to apply selected styling to selected paths
>    - Emit neural signal in `handlePathClick` using `emitUIEvent`
>    - Make Test 3 pass

> 10. **Refactor 3:** 
>     - Extract selection logic to private method `togglePathSelection(pathId: string): void`
>     - Extract signal emission to private method `emitPathSelectionSignal(pathId: string, isSelected: boolean): void`

> 11. **Test 4 (Scenario 6 - Maximum Selection Limit):** 
>     - Write failing test: User cannot select more than 4 paths, visual feedback when limit reached
>     - Assert: 5th selection attempt is ignored, state remains at 4 selected paths, user receives feedback

> 12. **Implement 4:** 
>     - Add maximum selection limit constant (4)
>     - Update `togglePathSelection` to check limit before adding new selection
>     - Add visual feedback (e.g., disabled state, tooltip) when limit reached
>     - Make Test 4 pass

> 13. **Test 5 (Scenario 3 - Path Comparison):** 
>     - Write failing test: When 2 paths are selected, comparison view shows side-by-side metrics with differences highlighted
>     - Assert: Comparison view renders, shows metrics for both paths, highlights differences

> 14. **Implement 5:** 
>     - Add comparison view rendering logic
>     - Implement `renderComparisonView(selectedPaths: ProductionPath[]): VDOMNode` method
>     - Calculate differences between paths (duration diff, cost diff, etc.)
>     - Apply highlighting to differences
>     - Make Test 5 pass

> 15. **Refactor 5:** 
>     - Extract difference calculation to `calculatePathDifferences(path1: PathMetrics, path2: PathMetrics): PathDifferences`
>     - Extract comparison rendering to separate method

> 16. **Test 6 (Scenario 10 - Bottleneck Highlighting):** 
>     - Write failing test: Paths with bottlenecks (over-allocated resources, critical delays) are visually highlighted
>     - Assert: Bottleneck detection works, visual indicators appear, tooltip explains issue

> 17. **Implement 6:** 
>     - Implement `detectBottlenecks(path: ProductionPath): Bottleneck[]` method
>     - Check for over-allocated resources (utilization > 100%)
>     - Check for critical path delays
>     - Update rendering to highlight bottlenecks
>     - Add tooltip/hover details for bottleneck explanation
>     - Make Test 6 pass

> 18. **Refactor 6:** 
>     - Extract bottleneck detection logic to separate methods for each bottleneck type
>     - Ensure bottleneck highlighting is accessible (ARIA labels)

> 19. **Test 7 (Scenario 5 - Invalid Path Data):** 
>     - Write failing test: Component handles invalid path data gracefully (missing fields, null values)
>     - Assert: Invalid paths are skipped or show error indicator, component doesn't crash

> 20. **Implement 7:** 
>     - Add data validation in constructor or `updateProps`
>     - Implement `validatePath(path: unknown): path is ProductionPath` type guard
>     - Filter out invalid paths or mark them with error indicators
>     - Make Test 7 pass

> 21. **Test 8 (Scenario 9 - Hover Details):** 
>     - Write failing test: Hovering over a path shows detailed metrics tooltip
>     - Assert: Tooltip appears on hover, shows expanded metrics, disappears on mouse leave

> 22. **Implement 8:** 
>     - Add hover state tracking to component state
>     - Implement hover event handlers
>     - Create tooltip rendering logic with detailed metrics
>     - Make Test 8 pass

> 23. **Test 9 (Scenario 12 - Resource Utilization Calculation):** 
>     - Write failing test: Resource utilization is calculated correctly, over-allocated resources are identified
>     - Assert: Utilization percentage is correct, over-allocated resources (>100%) are flagged

> 24. **Implement 9:** 
>     - Enhance `calculatePathMetrics` to include resource utilization
>     - Calculate utilization as (needed hours / available hours) * 100
>     - Flag resources with utilization > 100% as bottlenecks
>     - Make Test 9 pass

> 25. **Test 10 (Scenario 11 - Path Deselection):** 
>     - Write failing test: Clicking selected path deselects it, comparison updates, signal emitted
>     - Assert: Path is removed from selection, comparison view updates, deselection signal emitted

> 26. **Implement 10:** 
>     - Update `togglePathSelection` to handle deselection (remove from array if already selected)
>     - Update comparison view to handle deselection
>     - Emit deselection signal
>     - Make Test 10 pass

> 27. **Test 11 (Accessibility - Keyboard Navigation):** 
>     - Write failing test: Component supports keyboard navigation (Tab to paths, Enter/Space to select, Arrow keys to navigate)
>     - Assert: All interactive elements are keyboard accessible, focus indicators visible

> 28. **Implement 11:** 
>     - Add keyboard event handlers
>     - Implement focus management
>     - Add ARIA labels and roles
>     - Ensure focus indicators are visible
>     - Make Test 11 pass

> 29. **Test 12 (Integration - Neural Signal Emission):** 
>     - Write failing test: Component emits correct neural signals for all user interactions
>     - Assert: Signals are emitted with correct type, data, strength, and timestamp for selection, deselection, comparison changes

> 30. **Implement 12:** 
>     - Review all interaction points
>     - Ensure all signals follow Synapse signal format
>     - Add signal emission for comparison metric changes
>     - Make Test 12 pass

> 31. **Final Review:** 
>     - Ensure all public methods have clear TypeScript type definitions
>     - Verify all acceptance criteria are met
>     - Run full test suite and ensure >90% coverage
>     - Check for any console errors or warnings
>     - Verify component integrates with Theater system (create test specimen if needed)
>     - Review code for Clean Code principles (DRY, SOLID, meaningful names)
>     - Ensure error handling is comprehensive
>     - Verify responsive design considerations
>     - Document component usage in JSDoc comments

---

**Additional Notes:**
> - Start with the simplest visualization (list/table) and iterate to more complex visualizations (timeline, flow diagram) if time permits
> - Prioritize functionality over visual polish in initial implementation
> - Ensure all calculations are unit-tested separately if they become complex
> - Consider creating helper utilities for metric calculations if they're reused
> - Follow existing component patterns from `ButtonComponent` and chart components for consistency

