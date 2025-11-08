/**
 * Button Component Specimens
 *
 * Demonstrates how to create specimens for The Anatomy Theater.
 */

import { Specimen } from '../../src/theater/specimens/Specimen';
import type { SpecimenMetadata } from '../../src/theater/specimens/Specimen';
import { ButtonComponent } from './ButtonComponent';

/**
 * Create specimen metadata
 */
const metadata: SpecimenMetadata = {
  id: 'button',
  name: 'Button',
  category: 'Forms',
  tags: ['interactive', 'form', 'ui'],
  description: 'A versatile button component with multiple variants and states',
  version: '1.0.0',
  author: 'Synapse Team',
};

/**
 * Default Button Specimen
 */
export const DefaultButton = new Specimen(
  {
    ...metadata,
    id: 'button-default',
    name: 'Default Button',
  },
  (context) => {
    const button = new ButtonComponent({
      label: 'Click Me',
    });
    button.activate();
    return button;
  },
);

/**
 * Primary Button Variant
 */
export const PrimaryButton = new Specimen(
  {
    ...metadata,
    id: 'button-primary',
    name: 'Primary Button',
    tags: ['variant', 'primary'],
  },
  () => {
    const button = new ButtonComponent({
      label: 'Primary Action',
      variant: 'primary',
    });
    button.activate();
    return button;
  },
);

/**
 * Secondary Button Variant
 */
export const SecondaryButton = new Specimen(
  {
    ...metadata,
    id: 'button-secondary',
    name: 'Secondary Button',
    tags: ['variant', 'secondary'],
  },
  () => {
    const button = new ButtonComponent({
      label: 'Secondary Action',
      variant: 'secondary',
    });
    button.activate();
    return button;
  },
);

/**
 * Danger Button Variant
 */
export const DangerButton = new Specimen(
  {
    ...metadata,
    id: 'button-danger',
    name: 'Danger Button',
    tags: ['variant', 'danger'],
  },
  () => {
    const button = new ButtonComponent({
      label: 'Delete',
      variant: 'danger',
    });
    button.activate();
    return button;
  },
);

/**
 * Disabled Button State
 */
export const DisabledButton = new Specimen(
  {
    ...metadata,
    id: 'button-disabled',
    name: 'Disabled Button',
    tags: ['state', 'disabled'],
  },
  () => {
    const button = new ButtonComponent({
      label: 'Disabled',
      disabled: true,
    });
    button.activate();
    return button;
  },
);

/**
 * Interactive Button with Click Counter
 */
export const InteractiveButton = new Specimen(
  {
    ...metadata,
    id: 'button-interactive',
    name: 'Interactive Button',
    tags: ['interactive', 'stateful'],
    description: 'Button that tracks click count',
  },
  (context) => {
    const button = new ButtonComponent({
      label: `Clicked 0 times`,
      onClick: () => {
        const count = button.getState().clickCount;
        button.updateProps({ label: `Clicked ${count} times` });
      },
    });
    button.activate();
    return button;
  },
);

/**
 * Export all specimens as a collection
 */
export const ButtonSpecimens = [
  DefaultButton,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  DisabledButton,
  InteractiveButton,
];
