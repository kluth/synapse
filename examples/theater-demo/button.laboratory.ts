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
const renderingExperiment = new Experiment({
  id: 'button-rendering',
  name: 'Button Rendering',
  description: 'Tests that button renders correctly with different props',
});

renderingExperiment.setTestSubject(
  new TestSubject(ButtonComponent, {
    initialProps: { label: 'Test Button' },
    autoMount: true,
  }),
);

renderingExperiment.addHypothesis(
  new Hypothesis('renders-with-label').toContainText('Test Button'),
);

renderingExperiment.addHypothesis(
  new Hypothesis('is-mounted').toBeMounted(),
);

renderingExperiment.setTest(async (subject) => {
  // Render the button
  subject.render();

  // Verify label is in output
  const output = subject.getLastRender();
  return output.children?.includes('Test Button') ?? false;
});

ButtonLaboratory.registerExperiment(renderingExperiment);

/**
 * Experiment 2: Click Interactions
 */
const clickExperiment = new Experiment({
  id: 'button-clicks',
  name: 'Button Click Behavior',
  description: 'Tests button click interactions and state changes',
});

clickExperiment.setTestSubject(
  new TestSubject(ButtonComponent, {
    initialProps: { label: 'Click Me' },
    autoMount: true,
  }),
);

clickExperiment.addHypothesis(
  new Hypothesis('initial-click-count').toHaveState('clickCount', 0),
);

clickExperiment.addHypothesis(
  new Hypothesis('click-increments-count').toSatisfy((context) => {
    const button = context.component as ButtonComponent;
    button.handleClick();
    return button.getState().clickCount === 1;
  }),
);

clickExperiment.setTest(async (subject) => {
  const component = subject.getComponent() as ButtonComponent;

  // Initial state
  const initialCount = component.getState().clickCount;

  // Simulate click
  subject.interact({ type: 'click' });

  // Verify state changed
  const newCount = component.getState().clickCount;

  return newCount === initialCount + 1;
});

ButtonLaboratory.registerExperiment(clickExperiment);

/**
 * Experiment 3: Disabled State
 */
const disabledExperiment = new Experiment({
  id: 'button-disabled',
  name: 'Disabled Button Behavior',
  description: 'Tests that disabled buttons do not respond to clicks',
});

disabledExperiment.setTestSubject(
  new TestSubject(ButtonComponent, {
    initialProps: { label: 'Disabled', disabled: true },
    autoMount: true,
  }),
);

disabledExperiment.addHypothesis(
  new Hypothesis('disabled-no-click').toSatisfy((context) => {
    const button = context.component as ButtonComponent;
    const before = button.getState().clickCount;
    button.handleClick();
    const after = button.getState().clickCount;
    return before === after;
  }),
);

disabledExperiment.setTest(async (subject) => {
  const component = subject.getComponent() as ButtonComponent;

  const beforeClick = component.getState().clickCount;

  // Try to click disabled button
  component.handleClick();

  const afterClick = component.getState().clickCount;

  // Count should not change
  return beforeClick === afterClick;
});

ButtonLaboratory.registerExperiment(disabledExperiment);

/**
 * Experiment 4: Variant Styles
 */
const variantExperiment = new Experiment({
  id: 'button-variants',
  name: 'Button Variants',
  description: 'Tests different button variants render with correct styles',
});

variantExperiment.setTestSubject(
  new TestSubject(ButtonComponent, {
    initialProps: { label: 'Primary', variant: 'primary' },
    autoMount: true,
  }),
);

variantExperiment.setTest(async (subject) => {
  const component = subject.getComponent() as ButtonComponent;

  // Test primary variant
  component.updateProps({ variant: 'primary' });
  component.render();
  const primaryStyles = component['getStyles']();

  // Test secondary variant
  component.updateProps({ variant: 'secondary' });
  component.render();
  const secondaryStyles = component['getStyles']();

  // Test danger variant
  component.updateProps({ variant: 'danger' });
  component.render();
  const dangerStyles = component['getStyles']();

  // Verify different styles
  return (
    primaryStyles.background !== secondaryStyles.background &&
    secondaryStyles.background !== dangerStyles.background
  );
});

ButtonLaboratory.registerExperiment(variantExperiment);

/**
 * Experiment 5: Props Update
 */
const propsUpdateExperiment = new Experiment({
  id: 'button-props-update',
  name: 'Props Update Behavior',
  description: 'Tests that button responds to prop updates',
});

propsUpdateExperiment.setTestSubject(
  new TestSubject(ButtonComponent, {
    initialProps: { label: 'Initial' },
    autoMount: true,
  }),
);

propsUpdateExperiment.setTest(async (subject) => {
  const component = subject.getComponent() as ButtonComponent;

  // Update label
  subject.updateProps({ label: 'Updated' });
  subject.render();

  const output = subject.getLastRender();

  return output.children?.includes('Updated') ?? false;
});

ButtonLaboratory.registerExperiment(propsUpdateExperiment);

/**
 * Run all experiments and return report
 */
export async function runButtonTests(): Promise<void> {
  console.log('🧪 Running Button Component Tests...\n');

  await ButtonLaboratory.runAll();

  const stats = ButtonLaboratory.getStatistics();
  const report = ButtonLaboratory.generateReport();

  console.log('\n📊 Test Results:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Passed: ${stats.passed}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log(`  Success Rate: ${stats.successRate.toFixed(1)}%`);

  console.log('\n📝 Detailed Report:');
  console.log(report.formatAs('text'));
}
