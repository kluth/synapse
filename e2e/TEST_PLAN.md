# E2E Test Plan for Synapse Framework

**Version:** 1.0
**Date:** 2025-11-08
**Status:** Draft - Awaiting Review
**Framework:** @synapse-framework/core

---

## 📋 Overview

This document defines the comprehensive E2E test strategy for the Synapse Framework. All tests MUST be:
- Written in **TypeScript strict mode**
- Follow **TDD methodology** (failing test first, then implementation)
- Be **atomic** (one assertion per test)
- Use **Given-When-Then** format
- Treat the framework as a **black box** (no internal modifications)

---

## 🎯 Test Scope

### In Scope
- Component lifecycle (activation, deactivation, state transitions)
- Visual rendering in real browser environment
- User interactions (click, hover, keyboard)
- Signal propagation through neural network
- State management across components
- Integration between framework subsystems

### Out of Scope
- Unit tests (covered by existing 1,885 tests)
- Performance/load testing (separate epic)
- Internal implementation details
- Third-party dependency testing

---

## 📊 Test Categories

### Category 1: Component Lifecycle
Priority: **CRITICAL**
Estimated Tests: **15**

#### LC-1: VisualNeuron Activation
```gherkin
GIVEN a VisualNeuron component is created
WHEN the component is activated
THEN the component state changes to 'active'
```

#### LC-2: VisualNeuron Deactivation
```gherkin
GIVEN an active VisualNeuron component
WHEN the component is deactivated
THEN the component state changes to 'inactive'
```

#### LC-3: Component Mount Lifecycle
```gherkin
GIVEN a VisualNeuron component
WHEN the component is activated
THEN the onMount lifecycle hook is called
```

#### LC-4: Component Unmount Lifecycle
```gherkin
GIVEN an active VisualNeuron component
WHEN the component is deactivated
THEN the onUnmount lifecycle hook is called
```

#### LC-5: State Initialization
```gherkin
GIVEN a VisualNeuron with initial state
WHEN the component is created
THEN the component state matches the initial state
```

#### LC-6: Props Initialization
```gherkin
GIVEN a VisualNeuron with props
WHEN the component is created
THEN the component props are accessible via getProps()
```

#### LC-7: Render Count Tracking
```gherkin
GIVEN an active VisualNeuron
WHEN the component renders
THEN the render count increments by 1
```

#### LC-8: Activation Error Handling
```gherkin
GIVEN a VisualNeuron that throws during activation
WHEN the component is activated
THEN the error is caught and the component remains inactive
```

#### LC-9: Multiple Activation Attempts
```gherkin
GIVEN an already active VisualNeuron
WHEN activate() is called again
THEN the operation is idempotent (no error, stays active)
```

#### LC-10: Deactivation When Inactive
```gherkin
GIVEN an inactive VisualNeuron
WHEN deactivate() is called
THEN the operation is idempotent (no error)
```

#### LC-11: State Updates Trigger Re-render
```gherkin
GIVEN an active VisualNeuron
WHEN setState() is called with new state
THEN a state update signal is emitted
```

#### LC-12: Props Updates Trigger Re-render
```gherkin
GIVEN an active VisualNeuron
WHEN updateProps() is called with different props
THEN the component requests a re-render
```

#### LC-13: Props Updates Skip When Identical
```gherkin
GIVEN an active VisualNeuron
WHEN updateProps() is called with identical props
THEN no re-render is requested
```

#### LC-14: Event Listener Registration
```gherkin
GIVEN a VisualNeuron
WHEN an event listener is registered via on()
THEN the listener is called when events are emitted
```

#### LC-15: Event Listener Cleanup
```gherkin
GIVEN a VisualNeuron with registered listeners
WHEN the component is deactivated
THEN all event listeners are properly cleaned up
```

---

### Category 2: Visualization Components - LineChart
Priority: **HIGH**
Estimated Tests: **20**

#### VIS-LC-1: LineChart Renders SVG
```gherkin
GIVEN a LineChart component with data
WHEN the component is rendered in a browser
THEN an SVG element appears in the DOM
```

#### VIS-LC-2: LineChart Path Generation
```gherkin
GIVEN a LineChart with 5 data points
WHEN the component renders
THEN the SVG contains a <path> element with correct d attribute
```

#### VIS-LC-3: LineChart Dimensions
```gherkin
GIVEN a LineChart with width=800 and height=400
WHEN the component renders
THEN the SVG has width="800" and height="400"
```

#### VIS-LC-4: LineChart Data Point Hover
```gherkin
GIVEN a rendered LineChart
WHEN the user hovers over a data point
THEN the hovered point is highlighted visually
```

#### VIS-LC-5: LineChart Data Point Click
```gherkin
GIVEN a rendered LineChart
WHEN the user clicks on a data point
THEN a click event is emitted with the point data
```

#### VIS-LC-6: LineChart Empty Data
```gherkin
GIVEN a LineChart with empty data array
WHEN the component renders
THEN the chart renders without errors (no path)
```

#### VIS-LC-7: LineChart Color Customization
```gherkin
GIVEN a LineChart with color="#ff0000"
WHEN the component renders
THEN the line path has stroke="#ff0000"
```

#### VIS-LC-8: LineChart Smooth Curves
```gherkin
GIVEN a LineChart with smooth=true
WHEN the component renders
THEN the path uses cubic bezier curves (contains "C")
```

#### VIS-LC-9: LineChart Linear Lines
```gherkin
GIVEN a LineChart with smooth=false
WHEN the component renders
THEN the path uses straight lines (contains "L", no "C")
```

#### VIS-LC-10: LineChart Show Points
```gherkin
GIVEN a LineChart with showPoints=true
WHEN the component renders
THEN circles are rendered at each data point
```

#### VIS-LC-11: LineChart Hide Points
```gherkin
GIVEN a LineChart with showPoints=false
WHEN the component renders
THEN no circles are rendered
```

#### VIS-LC-12: LineChart Custom Line Width
```gherkin
GIVEN a LineChart with lineWidth=5
WHEN the component renders
THEN the path has stroke-width="5"
```

#### VIS-LC-13: LineChart Data Update
```gherkin
GIVEN a rendered LineChart
WHEN the data is updated via updateProps()
THEN the chart re-renders with new data
```

#### VIS-LC-14: LineChart Accessibility
```gherkin
GIVEN a rendered LineChart
WHEN inspecting the SVG element
THEN it has role="img" and aria-label
```

#### VIS-LC-15: LineChart Negative Values
```gherkin
GIVEN a LineChart with negative Y values
WHEN the component renders
THEN the chart displays correctly with proper scaling
```

#### VIS-LC-16: LineChart Single Point
```gherkin
GIVEN a LineChart with only 1 data point
WHEN the component renders
THEN the chart renders without errors
```

#### VIS-LC-17: LineChart Large Dataset
```gherkin
GIVEN a LineChart with 1000 data points
WHEN the component renders
THEN the rendering completes within 1 second
```

#### VIS-LC-18: LineChart Coordinate Transformation
```gherkin
GIVEN a LineChart with data range [0, 100]
WHEN dataToCanvas() is called with {x:50, y:50}
THEN the canvas coordinates are in the correct range
```

#### VIS-LC-19: LineChart Find Nearest Point
```gherkin
GIVEN a rendered LineChart
WHEN findNearestPoint() is called with canvas coordinates
THEN the nearest data point is returned
```

#### VIS-LC-20: LineChart Render Count
```gherkin
GIVEN a LineChart that renders 3 times
WHEN getRenderCount() is called
THEN it returns 3
```

---

### Category 3: Visualization Components - BarChart
Priority: **HIGH**
Estimated Tests: **18**

#### VIS-BC-1: BarChart Renders SVG
```gherkin
GIVEN a BarChart component with data
WHEN the component is rendered in a browser
THEN an SVG element with bars appears in the DOM
```

#### VIS-BC-2: BarChart Correct Number of Bars
```gherkin
GIVEN a BarChart with 5 data points
WHEN the component renders
THEN exactly 5 <rect> elements are in the DOM
```

#### VIS-BC-3: BarChart Vertical Orientation
```gherkin
GIVEN a BarChart with orientation="vertical"
WHEN the component renders
THEN bars grow upward from bottom axis
```

#### VIS-BC-4: BarChart Horizontal Orientation
```gherkin
GIVEN a BarChart with orientation="horizontal"
WHEN the component renders
THEN bars grow rightward from left axis
```

#### VIS-BC-5: BarChart Auto Width
```gherkin
GIVEN a BarChart with barWidth="auto"
WHEN the component renders
THEN bar widths are calculated automatically
```

#### VIS-BC-6: BarChart Custom Width
```gherkin
GIVEN a BarChart with barWidth=50
WHEN the component renders
THEN each bar has width=50
```

#### VIS-BC-7: BarChart Bar Spacing
```gherkin
GIVEN a BarChart with barSpacing=10
WHEN the component renders
THEN bars have 10px spacing between them
```

#### VIS-BC-8: BarChart Color
```gherkin
GIVEN a BarChart with color="#00ff00"
WHEN the component renders
THEN all bars have fill="#00ff00"
```

#### VIS-BC-9: BarChart Per-Bar Colors
```gherkin
GIVEN a BarChart where each data point has a color
WHEN the component renders
THEN each bar uses its own color
```

#### VIS-BC-10: BarChart Hover State
```gherkin
GIVEN a rendered BarChart
WHEN the user hovers over a bar
THEN the bar opacity changes to 0.8
```

#### VIS-BC-11: BarChart Selection State
```gherkin
GIVEN a rendered BarChart
WHEN the user clicks on a bar
THEN the bar shows selection styling (stroke)
```

#### VIS-BC-12: BarChart Negative Values
```gherkin
GIVEN a BarChart with negative values
WHEN the component renders
THEN bars extend in the correct direction
```

#### VIS-BC-13: BarChart Empty Data
```gherkin
GIVEN a BarChart with empty data array
WHEN the component renders
THEN no bars are rendered, no errors
```

#### VIS-BC-14: BarChart Stacked Mode
```gherkin
GIVEN a BarChart with stacked=true
WHEN the component renders
THEN bars are stacked correctly
```

#### VIS-BC-15: BarChart Find Bar at Point
```gherkin
GIVEN a rendered BarChart
WHEN findBarAtPoint() is called with canvas coordinates
THEN the correct bar data is returned if hit
```

#### VIS-BC-16: BarChart Accessibility
```gherkin
GIVEN a rendered BarChart
WHEN inspecting the SVG
THEN it has role="img" and descriptive aria-label
```

#### VIS-BC-17: BarChart Data Update
```gherkin
GIVEN a rendered BarChart
WHEN data is updated
THEN the chart re-renders with new bars
```

#### VIS-BC-18: BarChart Baseline at Zero
```gherkin
GIVEN a BarChart with positive values
WHEN the component renders
THEN the data bounds include 0 as baseline
```

---

### Category 4: Visualization Components - PieChart
Priority: **MEDIUM**
Estimated Tests: **15**

#### VIS-PC-1: PieChart Renders SVG
```gherkin
GIVEN a PieChart component with data
WHEN the component is rendered
THEN an SVG element with path slices appears
```

#### VIS-PC-2: PieChart Correct Number of Slices
```gherkin
GIVEN a PieChart with 4 data points
WHEN the component renders
THEN exactly 4 <path> elements are rendered
```

#### VIS-PC-3: PieChart Percentage Calculation
```gherkin
GIVEN a PieChart with values [30, 20, 50]
WHEN percentages are calculated
THEN they are [30%, 20%, 50%]
```

#### VIS-PC-4: PieChart Full Circle
```gherkin
GIVEN a PieChart with data
WHEN all slices are rendered
THEN the total angle is 360 degrees (2π radians)
```

#### VIS-PC-5: PieChart Slice Colors
```gherkin
GIVEN a PieChart where each data point has a color
WHEN the component renders
THEN each slice uses its assigned color
```

#### VIS-PC-6: PieChart Donut Mode
```gherkin
GIVEN a PieChart with innerRadius=50
WHEN the component renders
THEN slices have a hollow center (donut shape)
```

#### VIS-PC-7: PieChart Labels
```gherkin
GIVEN a PieChart with showLabels=true
WHEN the component renders
THEN text labels are positioned on each slice
```

#### VIS-PC-8: PieChart Percentages
```gherkin
GIVEN a PieChart with showPercentages=true
WHEN the component renders
THEN percentage text is displayed on slices
```

#### VIS-PC-9: PieChart Slice Hover
```gherkin
GIVEN a rendered PieChart
WHEN the user hovers over a slice
THEN the slice opacity changes
```

#### VIS-PC-10: PieChart Slice Click
```gherkin
GIVEN a rendered PieChart
WHEN the user clicks on a slice
THEN a click event is emitted with slice data
```

#### VIS-PC-11: PieChart Single Value
```gherkin
GIVEN a PieChart with one value (100%)
WHEN the component renders
THEN a complete circle is drawn
```

#### VIS-PC-12: PieChart Empty Data
```gherkin
GIVEN a PieChart with empty data
WHEN the component renders
THEN no slices are rendered, no errors
```

#### VIS-PC-13: PieChart Find Slice at Angle
```gherkin
GIVEN a rendered PieChart
WHEN findSliceAtAngle() is called
THEN the correct slice data is returned
```

#### VIS-PC-14: PieChart Accessibility
```gherkin
GIVEN a rendered PieChart
WHEN inspecting the SVG
THEN it has appropriate ARIA attributes
```

#### VIS-PC-15: PieChart Negative Values
```gherkin
GIVEN a PieChart with negative values
WHEN the component renders
THEN percentages are calculated correctly
```

---

### Category 5: Visualization Components - ScatterPlot
Priority: **MEDIUM**
Estimated Tests: **12**

#### VIS-SP-1: ScatterPlot Renders SVG
```gherkin
GIVEN a ScatterPlot with data
WHEN the component is rendered
THEN an SVG with point shapes appears
```

#### VIS-SP-2: ScatterPlot Circle Shape
```gherkin
GIVEN a ScatterPlot with pointShape="circle"
WHEN the component renders
THEN <circle> elements are rendered
```

#### VIS-SP-3: ScatterPlot Square Shape
```gherkin
GIVEN a ScatterPlot with pointShape="square"
WHEN the component renders
THEN <rect> elements are rendered
```

#### VIS-SP-4: ScatterPlot Triangle Shape
```gherkin
GIVEN a ScatterPlot with pointShape="triangle"
WHEN the component renders
THEN <polygon> elements are rendered
```

#### VIS-SP-5: ScatterPlot Bubble Mode
```gherkin
GIVEN a ScatterPlot with sizeField="size"
WHEN the component renders
THEN points have variable sizes based on data
```

#### VIS-SP-6: ScatterPlot Point Hover
```gherkin
GIVEN a rendered ScatterPlot
WHEN the user hovers over a point
THEN the point is highlighted
```

#### VIS-SP-7: ScatterPlot Point Click
```gherkin
GIVEN a rendered ScatterPlot
WHEN the user clicks on a point
THEN a click event is emitted
```

#### VIS-SP-8: ScatterPlot Clustering
```gherkin
GIVEN a ScatterPlot with clustered data
WHEN identifyClusters() is called
THEN clusters are identified correctly
```

#### VIS-SP-9: ScatterPlot Density Calculation
```gherkin
GIVEN a ScatterPlot with data
WHEN calculateDensity() is called for a point
THEN the correct density is returned
```

#### VIS-SP-10: ScatterPlot Find Nearest Point
```gherkin
GIVEN a rendered ScatterPlot
WHEN findNearestPoint() is called
THEN the nearest point is returned
```

#### VIS-SP-11: ScatterPlot Per-Point Colors
```gherkin
GIVEN a ScatterPlot with per-point colors
WHEN the component renders
THEN each point uses its color
```

#### VIS-SP-12: ScatterPlot Large Dataset
```gherkin
GIVEN a ScatterPlot with 1000 points
WHEN the component renders
THEN rendering completes within 1 second
```

---

### Category 6: Signal Propagation
Priority: **HIGH**
Estimated Tests: **10**

#### SIG-1: Simple Signal Transmission
```gherkin
GIVEN two connected NeuralNodes (A→B)
WHEN node A emits a signal
THEN node B receives the signal
```

#### SIG-2: Signal Above Threshold
```gherkin
GIVEN a NeuralNode with threshold=0.5
WHEN a signal with strength=0.7 is received
THEN the signal is processed
```

#### SIG-3: Signal Below Threshold
```gherkin
GIVEN a NeuralNode with threshold=0.5
WHEN a signal with strength=0.3 is received
THEN the signal is ignored
```

#### SIG-4: Multi-Node Propagation
```gherkin
GIVEN a chain of 3 nodes (A→B→C)
WHEN node A fires
THEN node C eventually receives the signal
```

#### SIG-5: Signal Strength Decay
```gherkin
GIVEN a synapse with decay factor
WHEN a signal passes through
THEN the signal strength decreases
```

#### SIG-6: Refractory Period
```gherkin
GIVEN a neuron with 100ms refractory period
WHEN two signals arrive 50ms apart
THEN only the first signal is processed
```

#### SIG-7: Excitatory Signal
```gherkin
GIVEN a neuron receiving excitatory signals
WHEN multiple signals accumulate
THEN the neuron fires
```

#### SIG-8: Inhibitory Signal
```gherkin
GIVEN a neuron receiving inhibitory signals
WHEN an inhibitory signal arrives
THEN the neuron's potential decreases
```

#### SIG-9: Signal Payload
```gherkin
GIVEN a signal with custom payload
WHEN the signal is transmitted
THEN the payload is preserved
```

#### SIG-10: Event Bus Integration
```gherkin
GIVEN components connected via circulatory system
WHEN one component emits an event
THEN subscribed components receive it
```

---

### Category 7: Integration Tests
Priority: **MEDIUM**
Estimated Tests: **8**

#### INT-1: Complete Application Flow
```gherkin
GIVEN a complete app with multiple components
WHEN the app initializes
THEN all components activate successfully
```

#### INT-2: Chart Data Pipeline
```gherkin
GIVEN a data source and a chart component
WHEN data flows from source to chart
THEN the chart renders with correct data
```

#### INT-3: Multiple Charts Coordination
```gherkin
GIVEN multiple charts sharing data
WHEN one chart updates
THEN other charts react appropriately
```

#### INT-4: State Synchronization
```gherkin
GIVEN components sharing state
WHEN one component updates state
THEN other components reflect the change
```

#### INT-5: Error Boundary
```gherkin
GIVEN a component that throws an error
WHEN the error occurs
THEN other components continue functioning
```

#### INT-6: Cleanup on Destroy
```gherkin
GIVEN an application with active components
WHEN the application is destroyed
THEN all resources are properly cleaned up
```

#### INT-7: Router Integration
```gherkin
GIVEN an app with routing
WHEN navigation occurs
THEN components mount/unmount correctly
```

#### INT-8: Form to Chart Pipeline
```gherkin
GIVEN a form and a chart
WHEN form data is submitted
THEN the chart updates with new data
```

---

## 📈 Test Priority Matrix

| Priority | Categories | Est. Tests | Complexity |
|----------|-----------|------------|------------|
| CRITICAL | Component Lifecycle | 15 | Medium |
| HIGH | LineChart, BarChart, Signals | 50 | High |
| MEDIUM | PieChart, ScatterPlot, Integration | 35 | Medium |
| LOW | Advanced Features | TBD | High |

**Total Initial Tests:** ~100

---

## 🔄 TDD Workflow

For each test case:

1. **RED:** Write the failing test
2. **GREEN:** Write minimal code to pass
3. **REFACTOR:** Clean up implementation
4. **COMMIT:** Commit with descriptive message

Example workflow:
```bash
# 1. Write test (RED)
vim e2e/tests/lifecycle.spec.ts
npm run test:e2e  # Should fail

# 2. Implement (GREEN)
vim e2e/demo-app/index.html
npm run test:e2e  # Should pass

# 3. Refactor
# Clean up code

# 4. Commit
git add .
git commit -m "test(e2e): LC-1 - VisualNeuron activation"
```

---

## 🎯 Success Criteria

- [ ] All tests follow Given-When-Then format
- [ ] Each test has exactly one assertion
- [ ] Tests are independent (can run in any order)
- [ ] Test code follows Clean Code principles
- [ ] All tests are under 5 seconds execution time
- [ ] No flaky tests (must pass consistently)
- [ ] 100% of planned tests implemented
- [ ] CI/CD integration working
- [ ] Documentation complete

---

## 📝 Review Checklist

Before implementation begins:

- [ ] Test plan reviewed by team
- [ ] All test cases clearly defined
- [ ] Given-When-Then format correct
- [ ] Test granularity appropriate (atomic)
- [ ] Priorities assigned correctly
- [ ] TDD workflow understood by team
- [ ] Tooling decisions confirmed
- [ ] Timeline estimated

---

**Approved By:** ________________
**Date:** ________________
**Next Phase:** Implementation (Phase 2)
