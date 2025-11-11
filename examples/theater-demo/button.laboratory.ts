/**
 * Button Component Laboratory Tests
 *
 * Demonstrates how to use The Anatomy Theater's Laboratory
 * testing system to test components.
 */

import { Laboratory } from '../../src/theater/laboratory/Laboratory';
import { Experiment } from '../../src/theater/laboratory/Experiment';
import { TestSubject } from '../../src/theater/laboratory/TestSubject';
import { Hypothesis } from '../../src/theater/laboratory/Hypothesis';
import { ButtonComponent } from './ButtonComponent';
import { LabReporter } from '../../src/theater/laboratory/LabReport';

/**
 * Create a Laboratory instance
 */
export const ButtonLaboratory = new Laboratory({
  name: 'Button Component Tests',
  verbose: true,
});

/**
 * Experiment 1: Basic Rendering
 */
const renderButton = new ButtonComponent({
  id: 'render-btn',
  type: 'cortical',
  threshold: 0.5,
  props: { label: 'Test Button' },
});
const renderSubject = new TestSubject({
  component: renderButton,
  autoMount: true,
});
const renderingExperiment = new Experiment({
  id: 'button-rendering',
  name: 'Button Rendering',
  description: 'Tests that button renders correctly with different props',
  testSubject: renderSubject,
  hypotheses: [
    Hypothesis.toContainText(renderSubject, 'Test Button'),
    Hypothesis.toBeMounted(renderSubject),
  ],
  test: async (subject) => {
    subject.render();
    const output = subject.getRenderOutput();
    if (!output.includes('Test Button')) {
      throw new Error('Expected output to contain "Test Button"');
    }
  },
});
ButtonLaboratory.registerExperiment(renderingExperiment);

/**
 * Experiment 2: Click Interactions
 */
const clickButton = new ButtonComponent({
  id: 'click-btn',
  type: 'cortical',
  threshold: 0.5,
  props: { label: 'Click Me' },
});
const clickSubject = new TestSubject({
  component: clickButton,
  autoMount: true,
});
const clickExperiment = new Experiment({
  id: 'button-clicks',
  name: 'Button Click Behavior',
  description: 'Tests button click interactions and state changes',
  testSubject: clickSubject,
  hypotheses: [Hypothesis.toHaveState(clickSubject, 'clickCount', 0)],
  test: async (subject) => {
    const initialCount = subject.getState()['clickCount'] as number;
    (subject.getComponent() as ButtonComponent).handleClick();
    const newCount = subject.getState()['clickCount'] as number;
    if (newCount !== initialCount + 1) {
      throw new Error('Click count should have incremented');
    }
  },
});
ButtonLaboratory.registerExperiment(clickExperiment);

/**
 * Experiment 3: Disabled State
 */
const disabledButton = new ButtonComponent({
  id: 'disabled-btn',
  type: 'cortical',
  threshold: 0.5,
  props: { label: 'Disabled', disabled: true },
});
const disabledSubject = new TestSubject({
  component: disabledButton,
  autoMount: true,
});
const disabledExperiment = new Experiment({
  id: 'button-disabled',
  name: 'Disabled Button Behavior',
  description: 'Tests that disabled buttons do not respond to clicks',
  testSubject: disabledSubject,
  test: async (subject) => {
    const beforeClick = subject.getState()['clickCount'] as number;
    (subject.getComponent() as ButtonComponent).handleClick();
    const afterClick = subject.getState()['clickCount'] as number;
    if (beforeClick !== afterClick) {
      throw new Error('Disabled button should not increment click count');
    }
  },
});
ButtonLaboratory.registerExperiment(disabledExperiment);

/**
 * Experiment 4: Variant Styles
 */
const variantButton = new ButtonComponent({
  id: 'variant-btn',
  type: 'cortical',
  threshold: 0.5,
  props: { label: 'Primary', variant: 'primary' },
});
const variantSubject = new TestSubject({
  component: variantButton,
  autoMount: true,
});
const variantExperiment = new Experiment({
  id: 'button-variants',
  name: 'Button Variants',
  description: 'Tests different button variants render with correct styles',
  testSubject: variantSubject,
  test: async (subject) => {
    (subject.getComponent() as ButtonComponent).updateProps({ variant: 'primary' });
    (subject.getComponent() as ButtonComponent).render();
    const primaryStyles = (subject.getComponent() as any).getStyles();
    (subject.getComponent() as ButtonComponent).updateProps({ variant: 'secondary' });
    (subject.getComponent() as ButtonComponent).render();
    const secondaryStyles = (subject.getComponent() as any).getStyles();
    if (primaryStyles['background'] === secondaryStyles['background']) {
      throw new Error('Variant styles should be different');
    }
  },
});
ButtonLaboratory.registerExperiment(variantExperiment);

/**
 * Experiment 5: Props Update
 */
const propsUpdateButton = new ButtonComponent({
  id: 'props-update-btn',
  type: 'cortical',
  threshold: 0.5,
  props: { label: 'Initial' },
});
const propsUpdateSubject = new TestSubject({
  component: propsUpdateButton,
  autoMount: true,
});
const propsUpdateExperiment = new Experiment({
  id: 'button-props-update',
  name: 'Props Update Behavior',
  description: 'Tests that button responds to prop updates',
  testSubject: propsUpdateSubject,
  test: async (subject) => {
    subject.setProps({ label: 'Updated' });
    const output = subject.getRenderOutput();
    if (!output.includes('Updated')) {
      throw new Error('Props update did not reflect in render output');
    }
  },
});
ButtonLaboratory.registerExperiment(propsUpdateExperiment);

/**
 * Run all experiments and return report
 */
export async function runButtonTests(): Promise<void> {
  console.log('🧪 Running Button Component Tests...\n');

  const report = await ButtonLaboratory.runAll();
  const stats = ButtonLaboratory.getStats();

  console.log('\n📊 Test Results:');
  console.log(`  Total: ${stats.totalExperiments}`);
  console.log(`  Passed: ${stats.passed}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);

  console.log('\n📝 Detailed Report:');
  console.log(LabReporter.formatText(report));
}
