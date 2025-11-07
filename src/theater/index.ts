/**
 * The Anatomy Theater - Component Development and Documentation System
 *
 * Phase 6 of the Synapse framework - a powerful component showcase and development
 * environment with medical-themed terminology.
 *
 * ## Core Components
 *
 * - **Theater**: Main orchestrator for the entire system
 * - **Stage**: Component rendering and observation platform
 * - **Amphitheater**: Component gallery and navigation
 * - **Instrument**: Base class for development tools
 *
 * ## Features
 *
 * - Real-time neural signal visualization
 * - Time-travel state debugging
 * - Live connection topology
 * - Signal replay
 * - Smart auto-documentation
 * - Health monitoring
 * - A/B testing
 * - Accessibility testing
 * - Performance profiling
 * - Component composition playground
 *
 * @module theater
 */

// Core components
export { Theater } from './core/Theater';
export type { TheaterState, TheaterEvents } from './core/Theater';

export { Stage, VIEWPORTS } from './core/Stage';
export type { Viewport, IsolationMode, StageConfig, MountedComponent } from './core/Stage';

export { Amphitheater } from './core/Amphitheater';
export type {
  SpecimenCategory,
  AmphitheaterTheme,
  AmphitheaterLayout,
  AmphitheaterConfig,
  FilterCriteria,
} from './core/Amphitheater';

export { Instrument } from './core/Instrument';
export type {
  InstrumentState,
  InstrumentPosition,
  InstrumentConfig,
  InstrumentData,
} from './core/Instrument';

export type { TheaterConfig, TheaterTheme } from './core/TheaterConfig';
export { DEFAULT_THEATER_CONFIG } from './core/TheaterConfig';

// Specimen system
export { Specimen } from './specimens/Specimen';
export type { SpecimenMetadata, SpecimenContext, SpecimenRenderFn } from './specimens/Specimen';

export { Observation, ObservationBuilder, createObservations } from './specimens/Observation';
export type { ObservationConfig } from './specimens/Observation';

export { Dissection, DissectionBuilder, createDissection } from './specimens/Dissection';
export type { PropType, PropDefinition, ComponentStructure } from './specimens/Dissection';

// Microscope instruments
export { Microscope } from './instruments/Microscope';
export type {
  InspectionMode,
  MicroscopeLens,
  InspectionResult,
  InspectionIssue,
  MicroscopeConfig,
} from './instruments/Microscope';

export { SignalTracer } from './instruments/SignalTracer';
export type { SignalTrace, SignalFlowGraph, SignalTracerConfig } from './instruments/SignalTracer';

export { StateExplorer } from './instruments/StateExplorer';
export type {
  StateSnapshot,
  StateDiff,
  TimeTravelAction,
  StateExplorerConfig,
} from './instruments/StateExplorer';

export { PerformanceProfiler } from './instruments/PerformanceProfiler';
export type {
  PerformanceMetric,
  RenderProfile,
  PerformanceBottleneck,
  PerformanceProfilerConfig,
} from './instruments/PerformanceProfiler';

export { HealthMonitor } from './instruments/HealthMonitor';
export type {
  HealthStatus,
  HealthCheck,
  HealthReport,
  ErrorEntry,
  HealthMonitorConfig,
} from './instruments/HealthMonitor';
