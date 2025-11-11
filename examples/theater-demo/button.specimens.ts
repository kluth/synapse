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
  () => {
    const button = new ButtonComponent({
      id: 'specimen-btn-default',
      type: 'cortical',
      threshold: 0.5,
      props: {
        label: 'Click Me',
      },
    });
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
      id: 'specimen-btn-primary',
      type: 'cortical',
      threshold: 0.5,
      props: {
        label: 'Primary Action',
        variant: 'primary',
      },
    });
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
      id: 'specimen-btn-secondary',
      type: 'cortical',
      threshold: 0.5,
      props: {
        label: 'Secondary Action',
        variant: 'secondary',
      },
    });
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
      id: 'specimen-btn-danger',
      type: 'cortical',
      threshold: 0.5,
      props: {
        label: 'Delete',
      },
    });
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
      id: 'specimen-btn-disabled',
      type: 'cortical',
      threshold: 0.5,
      props: {
        label: 'Disabled',
        disabled: true,
      },
    });
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
  () => {
    const button = new ButtonComponent({
      id: 'specimen-btn-interactive',
      type: 'cortical',
      threshold: 0.5,
      props: {
        label: `Clicked 0 times`,
        onClick: () => {
          const count = button.getState().clickCount;
          button.updateProps({ label: `Clicked ${count + 1} times` });
        },
      },
    });
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
