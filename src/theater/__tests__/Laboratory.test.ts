/**
 * Laboratory and Experiment Tests
 */

import { Laboratory } from '../laboratory/Laboratory';
import { Experiment } from '../laboratory/Experiment';
import { TestSubject } from '../laboratory/TestSubject';
import { Hypothesis } from '../laboratory/Hypothesis';
import { LabReporter } from '../laboratory/LabReport';
import { VisualNeuron } from '../../ui/VisualNeuron';
// Test component
class TestComponent extends VisualNeuron<{ label: string }> {
  constructor() {
    super({
      id: 'test-component',
      type: 'cortical',
      threshold: 0.5,
      props: { label: 'Test' },
      initialState: { value: 0 },
    });
  }

  protected executeProcessing(): Promise<void> {
    return Promise.resolve();
  }

  protected performRender() {
    const label = this.receptiveField.label ?? 'Test';

    return {
      type: 'render' as const,
      data: {
        vdom: {
          tag: 'div',
          children: [label],
        },
        styles: {},
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}

describe('Experiment - Test Scenario', () => {
  describe('Construction', () => {
    it('should create an experiment', () => {
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test Experiment',
      });

      expect(experiment.getId()).toBe('test-1');
      expect(experiment.getName()).toBe('Test Experiment');
    });

    it('should accept description', () => {
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        description: 'This is a test experiment',
      });

      expect(experiment.getDescription()).toBe('This is a test experiment');
    });

    it('should initialize with pending state', () => {
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
      });

      expect(experiment.getState()).toBe('pending');
    });
  });

  describe('Test Subject', () => {
    it('should set test subject', () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component });
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
      });

      experiment.setTestSubject(subject);

      expect(experiment.getTestSubject()).toBe(subject);
    });

    it('should accept test subject in config', () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component });
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      expect(experiment.getTestSubject()).toBe(subject);
    });
  });

  describe('Hypotheses', () => {
    it('should add hypotheses', () => {
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
      });

      const hypothesis = new Hypothesis('test', () => {
        expect(true).toBe(true);
      });

      experiment.addHypothesis(hypothesis);

      expect(experiment.getHypotheses()).toHaveLength(1);
    });

    it('should accept hypotheses in config', () => {
      const hypotheses = [new Hypothesis('test1', () => {}), new Hypothesis('test2', () => {})];

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        hypotheses,
      });

      expect(experiment.getHypotheses()).toHaveLength(2);
    });
  });

  describe('Running Experiments', () => {
    it('should run a simple experiment', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Simple Test',
        testSubject: subject,
      });

      const result = await experiment.run();

      expect(result.success).toBe(true);
      expect(result.experimentId).toBe('test-1');
      expect(result.experimentName).toBe('Simple Test');

      await subject.cleanup();
    });

    it('should validate hypotheses', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Hypothesis Test',
        testSubject: subject,
        hypotheses: [Hypothesis.toBeMounted(subject), Hypothesis.toBeActive(subject)],
      });

      const result = await experiment.run();

      expect(result.success).toBe(true);
      expect(result.hypotheses).toHaveLength(2);
      expect(result.hypotheses.every((h) => h.passed)).toBe(true);

      await subject.cleanup();
    });

    it('should fail when hypothesis fails', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Failing Test',
        testSubject: subject,
        hypotheses: [Hypothesis.toHaveState(subject, 'value', 999)],
      });

      const result = await experiment.run();

      expect(result.success).toBe(false);
      expect(result.hypotheses[0].passed).toBe(false);

      await subject.cleanup();
    });

    it('should run setup before test', async () => {
      let setupRan = false;

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Setup Test',
        testSubject: subject,
        setup: () => {
          setupRan = true;
        },
      });

      await experiment.run();

      expect(setupRan).toBe(true);

      await subject.cleanup();
    });

    it('should run teardown after test', async () => {
      let teardownRan = false;

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Teardown Test',
        testSubject: subject,
        teardown: () => {
          teardownRan = true;
        },
      });

      await experiment.run();

      expect(teardownRan).toBe(true);

      await subject.cleanup();
    });

    it('should run test function', async () => {
      let testRan = false;

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test Function',
        testSubject: subject,
        test: (subj) => {
          testRan = true;
          expect(subj).toBe(subject);
        },
      });

      await experiment.run();

      expect(testRan).toBe(true);

      await subject.cleanup();
    });

    it('should run teardown even on error', async () => {
      let teardownRan = false;

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Error Test',
        testSubject: subject,
        test: () => {
          throw new Error('Test error');
        },
        teardown: () => {
          teardownRan = true;
        },
      });

      await experiment.run();

      expect(teardownRan).toBe(true);

      await subject.cleanup();
    });
  });

  describe('Experiment Control', () => {
    it('should skip experiment when skip is true', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Skipped Test',
        testSubject: subject,
        skip: true,
      });

      const result = await experiment.run();

      expect(experiment.getState()).toBe('skipped');
      expect(result.success).toBe(true);

      await subject.cleanup();
    });

    it('should support only flag', () => {
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Only Test',
        only: true,
      });

      expect(experiment.isOnly()).toBe(true);
    });

    it('should reset experiment state', async () => {
      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Reset Test',
        testSubject: subject,
      });

      await experiment.run();
      expect(experiment.getState()).not.toBe('pending');

      experiment.reset();
      expect(experiment.getState()).toBe('pending');

      await subject.cleanup();
    });
  });

  describe('Export', () => {
    it('should export experiment data', () => {
      const experiment = new Experiment({
        id: 'test-1',
        name: 'Export Test',
        description: 'Testing export',
        skip: true,
        hypotheses: [new Hypothesis('h1', () => {})],
      });

      const exported = experiment.export();

      expect(exported.id).toBe('test-1');
      expect(exported.name).toBe('Export Test');
      expect(exported.description).toBe('Testing export');
      expect(exported.skip).toBe(true);
      expect(exported.hypotheses).toBe(1);
    });
  });
});

describe('Laboratory - Testing Orchestrator', () => {
  describe('Construction', () => {
    it('should create a laboratory', () => {
      const lab = new Laboratory();

      expect(lab.getName()).toBe('Laboratory');
      expect(lab.getState()).toBe('idle');
    });

    it('should accept custom name', () => {
      const lab = new Laboratory({ name: 'Custom Lab' });

      expect(lab.getName()).toBe('Custom Lab');
    });

    it('should accept configuration', () => {
      const lab = new Laboratory({
        name: 'Test Lab',
        parallel: true,
        maxParallel: 10,
        timeout: 10000,
        verbose: false,
      });

      expect(lab.getName()).toBe('Test Lab');
    });
  });

  describe('Experiment Management', () => {
    it('should register experiments', () => {
      const lab = new Laboratory();
      const experiment = new Experiment({ id: 'test-1', name: 'Test' });

      lab.registerExperiment(experiment);

      expect(lab.getAllExperiments()).toHaveLength(1);
      expect(lab.getExperiment('test-1')).toBe(experiment);
    });

    it('should throw error for duplicate experiment IDs', () => {
      const lab = new Laboratory();
      const exp1 = new Experiment({ id: 'test-1', name: 'Test 1' });
      const exp2 = new Experiment({ id: 'test-1', name: 'Test 2' });

      lab.registerExperiment(exp1);

      expect(() => lab.registerExperiment(exp2)).toThrow('already registered');
    });

    it('should unregister experiments', () => {
      const lab = new Laboratory();
      const experiment = new Experiment({ id: 'test-1', name: 'Test' });

      lab.registerExperiment(experiment);
      lab.unregisterExperiment('test-1');

      expect(lab.getAllExperiments()).toHaveLength(0);
    });

    it('should clear all experiments', () => {
      const lab = new Laboratory();
      lab.registerExperiment(new Experiment({ id: 'test-1', name: 'Test 1' }));
      lab.registerExperiment(new Experiment({ id: 'test-2', name: 'Test 2' }));

      lab.clear();

      expect(lab.getAllExperiments()).toHaveLength(0);
    });
  });

  describe('Running Experiments', () => {
    it('should run all experiments', async () => {
      const lab = new Laboratory({ verbose: false });

      const component1 = new TestComponent();
      const subject1 = new TestSubject({ component: component1, autoMount: true });

      const component2 = new TestComponent();
      const subject2 = new TestSubject({ component: component2, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const exp1 = new Experiment({
        id: 'test-1',
        name: 'Test 1',
        testSubject: subject1,
        hypotheses: [Hypothesis.toBeMounted(subject1)],
      });

      const exp2 = new Experiment({
        id: 'test-2',
        name: 'Test 2',
        testSubject: subject2,
        hypotheses: [Hypothesis.toBeActive(subject2)],
      });

      lab.registerExperiment(exp1);
      lab.registerExperiment(exp2);

      const report = await lab.runAll();

      expect(report.stats.totalExperiments).toBe(2);
      expect(report.stats.passed).toBe(2);
      expect(report.success).toBe(true);

      await subject1.cleanup();
      await subject2.cleanup();
    });

    it('should run a single experiment', async () => {
      const lab = new Laboratory({ verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test 1',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);

      const result = await lab.runExperiment('test-1');

      expect(result.success).toBe(true);
      expect(result.experimentId).toBe('test-1');

      await subject.cleanup();
    });

    it('should track failed experiments', async () => {
      const lab = new Laboratory({ verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Failing Test',
        testSubject: subject,
        hypotheses: [Hypothesis.toHaveState(subject, 'value', 999)],
      });

      lab.registerExperiment(experiment);

      const report = await lab.runAll();

      expect(report.stats.failed).toBe(1);
      expect(report.success).toBe(false);

      await subject.cleanup();
    });

    it('should collect experiment results', async () => {
      const lab = new Laboratory({ verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      await lab.runAll();

      const result = lab.getResult('test-1');

      expect(result).toBeDefined();
      expect(result?.experimentId).toBe('test-1');

      await subject.cleanup();
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', async () => {
      const lab = new Laboratory({ verbose: false });

      const component1 = new TestComponent();
      const subject1 = new TestSubject({ component: component1, autoMount: true });

      const component2 = new TestComponent();
      const subject2 = new TestSubject({ component: component2, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const exp1 = new Experiment({
        id: 'test-1',
        name: 'Passing Test',
        testSubject: subject1,
        hypotheses: [Hypothesis.toBeMounted(subject1)],
      });

      const exp2 = new Experiment({
        id: 'test-2',
        name: 'Failing Test',
        testSubject: subject2,
        hypotheses: [Hypothesis.toHaveState(subject2, 'value', 999)],
      });

      lab.registerExperiment(exp1);
      lab.registerExperiment(exp2);

      await lab.runAll();

      const stats = lab.getStats();

      expect(stats.totalExperiments).toBe(2);
      expect(stats.passed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe(0.5);

      await subject1.cleanup();
      await subject2.cleanup();
    });
  });

  describe('Report Generation', () => {
    it('should generate lab report', async () => {
      const lab = new Laboratory({ name: 'Test Lab', verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      const report = await lab.runAll();

      expect(report.laboratoryName).toBe('Test Lab');
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.stats).toBeDefined();
      expect(report.results).toHaveLength(1);

      await subject.cleanup();
    });

    it('should format report as text', async () => {
      const lab = new Laboratory({ verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      const report = await lab.runAll();

      const text = LabReporter.formatText(report);

      expect(text).toContain('Laboratory Report');
      expect(text).toContain('SUMMARY');
      expect(text).toContain('Total Experiments');

      await subject.cleanup();
    });

    it('should format report as JSON', async () => {
      const lab = new Laboratory({ verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      const report = await lab.runAll();

      const json = LabReporter.formatJSON(report);
      const parsed = JSON.parse(json);

      expect(parsed.laboratoryName).toBe('Laboratory');
      expect(parsed.stats).toBeDefined();

      await subject.cleanup();
    });

    it('should format report as HTML', async () => {
      const lab = new Laboratory({ verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      const report = await lab.runAll();

      const html = LabReporter.formatHTML(report);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Laboratory Report');

      await subject.cleanup();
    });

    it('should format report as Markdown', async () => {
      const lab = new Laboratory({ verbose: false });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      const report = await lab.runAll();

      const markdown = LabReporter.formatMarkdown(report);

      expect(markdown).toContain('# Laboratory Report');
      expect(markdown).toContain('## Summary');

      await subject.cleanup();
    });
  });

  describe('Events', () => {
    it('should emit started event', async () => {
      const lab = new Laboratory({ verbose: false });

      let startedEmitted = false;
      lab.on('started', () => {
        startedEmitted = true;
      });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      await lab.runAll();

      expect(startedEmitted).toBe(true);

      await subject.cleanup();
    });

    it('should emit completed event', async () => {
      const lab = new Laboratory({ verbose: false });

      let completedEmitted = false;
      lab.on('completed', () => {
        completedEmitted = true;
      });

      const component = new TestComponent();
      const subject = new TestSubject({ component, autoMount: true });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const experiment = new Experiment({
        id: 'test-1',
        name: 'Test',
        testSubject: subject,
      });

      lab.registerExperiment(experiment);
      await lab.runAll();

      expect(completedEmitted).toBe(true);

      await subject.cleanup();
    });
  });

  describe('Export', () => {
    it('should export laboratory data', () => {
      const lab = new Laboratory({ name: 'Test Lab' });

      lab.registerExperiment(new Experiment({ id: 'test-1', name: 'Test 1' }));
      lab.registerExperiment(new Experiment({ id: 'test-2', name: 'Test 2' }));

      const exported = lab.export();

      expect(exported.name).toBe('Test Lab');
      expect(exported.state).toBe('idle');
      expect(exported.experiments).toBe(2);
    });
  });
});
