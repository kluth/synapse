/**
 * Laboratory - Testing Environment
 *
 * The Laboratory module provides a comprehensive testing environment
 * for components within The Anatomy Theater. It includes experiment
 * management, test subjects, hypothesis validation, and reporting.
 */

// Laboratory
export { Laboratory } from './Laboratory';
export type { LaboratoryConfig, LaboratoryState, LaboratoryStats } from './Laboratory';

// Experiment
export { Experiment } from './Experiment';
export type { ExperimentConfig, ExperimentResult, ExperimentState } from './Experiment';

// TestSubject
export { TestSubject } from './TestSubject';
export type { TestSubjectConfig, Interaction } from './TestSubject';

// Hypothesis
export { Hypothesis } from './Hypothesis';
export type { HypothesisResult, AssertionFn, MatcherFn } from './Hypothesis';

// LabReport
export { LabReporter } from './LabReport';
export type { LabReport, ReportFormat } from './LabReport';
