/**
 * Button Component Documentation
 *
 * Demonstrates how to use The Anatomy Theater's Atlas
 * to create comprehensive component documentation.
 */

import { Atlas } from '../../src/theater/atlas/Atlas';
import { ComponentCatalogue } from '../../src/theater/atlas/ComponentCatalogue';
import { Diagram } from '../../src/theater/atlas/Diagram';
import { Protocol } from '../../src/theater/atlas/Protocol';
import type { ComponentDocumentation } from '../../src/theater/atlas/Atlas';
import type { CatalogueEntry } from '../../src/theater/atlas/ComponentCatalogue';

/**
 * Create Atlas instance
 */
export const ButtonAtlas = new Atlas({
  name: 'Button Documentation',
  autoGenerate: true,
});

/**
 * Button Component Documentation
 */
const buttonDocumentation: ComponentDocumentation = {
  id: 'button',
  name: 'Button',
  description:
    'A versatile button component that supports multiple variants, states, and interactive behaviors. Built on top of VisualNeuron for reactive state management.',
  category: 'Forms',
  tags: ['button', 'interactive', 'form', 'ui', 'input'],

  props: [
    {
      name: 'label',
      type: 'string',
      required: true,
      description: 'The text content displayed on the button',
      defaultValue: undefined,
    },
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'danger'",
      required: false,
      description: 'Visual style variant of the button',
      defaultValue: 'primary',
    },
    {
      name: 'disabled',
      type: 'boolean',
      required: false,
      description: 'Whether the button is disabled and non-interactive',
      defaultValue: false,
    },
    {
      name: 'onClick',
      type: '() => void',
      required: false,
      description: 'Callback function invoked when button is clicked',
      defaultValue: undefined,
    },
  ],

  state: [
    {
      key: 'pressed',
      type: 'boolean',
      description: 'Indicates whether the button is currently in pressed state',
      initialValue: false,
    },
    {
      key: 'clickCount',
      type: 'number',
      description: 'Tracks the total number of times the button has been clicked',
      initialValue: 0,
    },
  ],

  signals: [
    {
      type: 'ui:click',
      description: 'Emitted when the button is successfully clicked',
      dataType: '{ clickCount: number }',
      trigger: 'User clicks the button',
    },
  ],

  examples: [
    {
      title: 'Basic Usage',
      description: 'Create a simple button with a label',
      code: `const button = new ButtonComponent({
  id: 'btn-basic',
  type: 'cortical',
  threshold: 0.5,
  props: {
    label: 'Click Me'
  }
});
button.activate();`,
      language: 'typescript',
    },
    {
      title: 'With Click Handler',
      description: 'Button with custom click handler',
      code: `const button = new ButtonComponent({
  id: 'btn-handler',
  type: 'cortical',
  threshold: 0.5,
  props: {
    label: 'Submit',
    variant: 'primary',
    onClick: () => {
      console.log('Button clicked!');
    }
  }
});`,
      language: 'typescript',
    },
    {
      title: 'Disabled State',
      description: 'Create a disabled button',
      code: `const button = new ButtonComponent({
  id: 'btn-disabled',
  type: 'cortical',
  threshold: 0.5,
  props: {
    label: 'Disabled',
    disabled: true
  }
});`,
      language: 'typescript',
    },
    {
      title: 'Danger Variant',
      description: 'Use danger variant for destructive actions',
      code: `const deleteButton = new ButtonComponent({
  id: 'btn-danger',
  type: 'cortical',
  threshold: 0.5,
  props: {
    label: 'Delete',
    variant: 'danger',
    onClick: () => handleDelete()
  }
});`,
      language: 'typescript',
    },
  ],

  related: [],
  source: 'examples/theater-demo/ButtonComponent.ts',
  timestamp: Date.now(),
};

// Add documentation to Atlas
ButtonAtlas.document(buttonDocumentation);

/**
 * Create Component Catalogue
 */
export const ButtonCatalogue = new ComponentCatalogue({
  name: 'UI Components Catalogue',
});

const buttonEntry: CatalogueEntry = {
  id: 'button',
  documentation: buttonDocumentation,
  dependencies: ['VisualNeuron'],
  dependents: [],
  version: '1.0.0',
  stability: 'stable',
  popularity: 0,
  lastUpdated: Date.now(),
  maintained: true,
};

ButtonCatalogue.add(buttonEntry);

/**
 * Create Component Diagrams
 */
export const ButtonDiagram = new Diagram();

// Generate component hierarchy diagram
export function generateHierarchyDiagram(): string {
  return ButtonDiagram.generateComponentHierarchy([buttonDocumentation], {
    type: 'component-hierarchy',
    format: 'mermaid',
    title: 'Button Component Hierarchy',
    direction: 'TB',
  });
}

// Generate state machine diagram
export function generateStateMachineDiagram(): string {
  return ButtonDiagram.generateStateMachine(
    [
      { name: 'idle', type: 'initial', description: 'Button is ready' },
      { name: 'pressed', type: 'active', description: 'Button is being pressed' },
      { name: 'clicked', type: 'active', description: 'Click event fired' },
      { name: 'disabled', type: 'final', description: 'Button is disabled' },
    ],
    [
      { from: 'idle', to: 'pressed', trigger: 'mousedown' },
      { from: 'pressed', to: 'clicked', trigger: 'mouseup' },
      { from: 'clicked', to: 'idle', trigger: 'reset' },
      { from: 'idle', to: 'disabled', trigger: 'disable', guard: 'isDisabled' },
    ],
    {
      type: 'state-machine',
      format: 'mermaid',
      title: 'Button State Machine',
    },
  );
}

/**
 * Create Component Protocol (Best Practices)
 */
export const ButtonProtocol = new Protocol({
  name: 'Button Best Practices',
  enforceSeverity: true,
  includeExamples: true,
  autoGenerateChecklists: true,
});

// Add usage pattern
ButtonProtocol.createUsagePattern(
  'button-usage-1',
  'Use Descriptive Labels',
  'Button labels should clearly describe the action that will be performed',
  [
    {
      title: 'Good Example',
      description: 'Clear, action-oriented label',
      code: `<Button label="Save Changes" />`,
      language: 'typescript',
      good: true,
      explanation: 'The label clearly indicates what will happen when clicked',
    },
    {
      title: 'Bad Example',
      description: 'Vague label',
      code: `<Button label="OK" />`,
      language: 'typescript',
      good: false,
      explanation: 'Generic labels like "OK" do not describe the action',
    },
  ],
  {
    severity: 'important',
    tags: ['usability', 'labels'],
  },
);

// Add accessibility guideline
ButtonProtocol.createAccessibilityGuideline(
  'button-a11y-1',
  'Keyboard Navigation',
  'Buttons must be accessible via keyboard (Enter and Space keys)',
  '2.1',
  '2.1.1',
  {
    severity: 'critical',
  },
);

ButtonProtocol.createAccessibilityGuideline(
  'button-a11y-2',
  'Disabled State Indication',
  'Disabled buttons must be visually distinguishable and convey their state',
  '2.1',
  '3.2.4',
  {
    severity: 'important',
  },
);

// Add performance guideline
ButtonProtocol.createPerformanceGuideline(
  'button-perf-1',
  'Minimize Re-renders',
  'Use shouldUpdate to prevent unnecessary re-renders when props have not changed',
  'medium',
  {
    tags: ['performance', 'rendering'],
  },
);

/**
 * Search Documentation
 */
export function searchButtonDocs(query: string): void {
  const results = ButtonAtlas.search({ text: query });

  console.log(`\n🔍 Search Results for "${query}":\n`);

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.documentation.name}`);
    console.log(`   Score: ${result.score.toFixed(2)}`);
    console.log(`   Matches: ${result.matches.join(', ')}`);
    console.log(`   Description: ${result.documentation.description}`);
    console.log('');
  });
}

/**
 * Generate Complete Documentation
 */
export function generateFullDocumentation(): void {
  console.log('📚 Button Component Documentation\n');
  console.log('='.repeat(50));

  // Component Info
  console.log('\n## Component Information\n');
  console.log(`Name: ${buttonDocumentation.name}`);
  console.log(`Category: ${buttonDocumentation.category}`);
  console.log(`Description: ${buttonDocumentation.description}`);
  console.log(`Tags: ${buttonDocumentation.tags.join(', ')}`);

  // Props
  console.log('\n## Props\n');
  buttonDocumentation.props.forEach((prop) => {
    console.log(`- **${prop.name}** (${prop.type})${prop.required ? ' *required*' : ''}`);
    console.log(`  ${prop.description}`);
    if (prop.defaultValue !== undefined) {
      console.log(`  Default: \`${String(prop.defaultValue)}\``);
    }
    console.log('');
  });

  // State
  console.log('\n## State\n');
  buttonDocumentation.state.forEach((state) => {
    console.log(`- **${state.key}** (${state.type})`);
    console.log(`  ${state.description}`);
    if (state.initialValue !== undefined) {
      console.log(`  Default: \`${String(state.initialValue)}\``);
    }
    console.log('');
  });

  // Examples
  console.log('\n## Examples\n');
  buttonDocumentation.examples.forEach((example) => {
    console.log(`### ${example.title}\n`);
    console.log(`${example.description}\n`);
    console.log('```' + example.language);
    console.log(example.code);
    console.log('```\n');
  });

  // Diagrams
  console.log('\n## State Machine\n');
  console.log('```mermaid');
  console.log(generateStateMachineDiagram());
  console.log('```\n');

  // Best Practices
  console.log('\n## Best Practices\n');
  const guidelines = ButtonProtocol.getAllGuidelines();
  guidelines.forEach((guideline) => {
    console.log(`### ${guideline.title}`);
    console.log(`**Type:** ${guideline.type} | **Severity:** ${guideline.severity}\n`);
    console.log(`${guideline.description}\n`);
  });

  // Statistics
  const atlasStats = ButtonAtlas.getStatistics();
  console.log('\n## Documentation Statistics\n');
  console.log(`Total Components: ${atlasStats.totalComponents}`);
  console.log(`Total Examples: ${atlasStats.totalExamples}`);
  console.log(`Categories: ${Object.keys(atlasStats.byCategory).join(', ')}`);
}
