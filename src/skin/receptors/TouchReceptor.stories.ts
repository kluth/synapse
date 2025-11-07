/**
 * TouchReceptor Storybook Stories
 *
 * Demonstrates the TouchReceptor (button) component with all variants,
 * sizes, and states using pure Web Components standards.
 */

import type { Meta, StoryObj } from '@storybook/html';
import { within, userEvent, expect } from '@storybook/test';
import './TouchReceptor';

interface TouchReceptorArgs {
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'small' | 'medium' | 'large';
  disabled: boolean;
  loading: boolean;
}

const meta: Meta<TouchReceptorArgs> = {
  title: 'Skin/Receptors/TouchReceptor',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Button label text',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
  },
  render: (args) => {
    const receptor = document.createElement('touch-receptor');
    receptor.setAttribute('label', args.label);
    receptor.setAttribute('variant', args.variant);
    receptor.setAttribute('size', args.size);
    if (args.disabled) receptor.setAttribute('disabled', '');
    if (args.loading) receptor.setAttribute('loading', '');

    // Add event listener to show interaction
    receptor.addEventListener('touch', ((event: CustomEvent) => {
      console.log('TouchReceptor touched:', event.detail);
    }) as EventListener);

    receptor.addEventListener('neural-signal', ((event: CustomEvent) => {
      console.log('Neural signal emitted:', event.detail);
    }) as EventListener);

    return receptor;
  },
};

export default meta;
type Story = StoryObj<TouchReceptorArgs>;

/**
 * Default primary button
 */
export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const receptor = canvasElement.querySelector('touch-receptor');

    // Test: Button is visible
    expect(receptor).toBeInTheDocument();

    // Test: Has shadow DOM
    expect(receptor?.shadowRoot).not.toBeNull();

    // Test: Can receive focus
    receptor?.focus();

    // Test: Emits events on click
    let eventFired = false;
    receptor?.addEventListener('touch', () => {
      eventFired = true;
    });

    const button = receptor?.shadowRoot?.querySelector('button');
    if (button) {
      await userEvent.click(button);
      expect(eventFired).toBe(true);
    }
  },
};

/**
 * Secondary button variant
 */
export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
    size: 'medium',
    disabled: false,
    loading: false,
  },
};

/**
 * Danger button for destructive actions
 */
export const Danger: Story = {
  args: {
    label: 'Delete',
    variant: 'danger',
    size: 'medium',
    disabled: false,
    loading: false,
  },
};

/**
 * Ghost button with minimal styling
 */
export const Ghost: Story = {
  args: {
    label: 'Cancel',
    variant: 'ghost',
    size: 'medium',
    disabled: false,
    loading: false,
  },
};

/**
 * Small size button
 */
export const Small: Story = {
  args: {
    label: 'Small Button',
    variant: 'primary',
    size: 'small',
    disabled: false,
    loading: false,
  },
};

/**
 * Large size button
 */
export const Large: Story = {
  args: {
    label: 'Large Button',
    variant: 'primary',
    size: 'large',
    disabled: false,
    loading: false,
  },
};

/**
 * Disabled button
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    variant: 'primary',
    size: 'medium',
    disabled: true,
    loading: false,
  },
  play: async ({ canvasElement }) => {
    const receptor = canvasElement.querySelector('touch-receptor');
    const button = receptor?.shadowRoot?.querySelector('button');

    // Test: Button is disabled
    expect(button?.hasAttribute('disabled')).toBe(true);

    // Test: Click does not fire event
    let eventFired = false;
    receptor?.addEventListener('touch', () => {
      eventFired = true;
    });

    if (button) {
      await userEvent.click(button);
      expect(eventFired).toBe(false);
    }
  },
};

/**
 * Loading button
 */
export const Loading: Story = {
  args: {
    label: 'Loading...',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: true,
  },
};

/**
 * All variants side by side
 */
export const AllVariants: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '1rem';
    container.style.flexWrap = 'wrap';

    const variants: Array<'primary' | 'secondary' | 'danger' | 'ghost'> = [
      'primary',
      'secondary',
      'danger',
      'ghost',
    ];

    variants.forEach((variant) => {
      const receptor = document.createElement('touch-receptor');
      receptor.setAttribute('label', `${variant.charAt(0).toUpperCase() + variant.slice(1)}`);
      receptor.setAttribute('variant', variant);
      receptor.setAttribute('size', 'medium');
      container.appendChild(receptor);
    });

    return container;
  },
};

/**
 * All sizes side by side
 */
export const AllSizes: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '1rem';
    container.style.alignItems = 'center';

    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

    sizes.forEach((size) => {
      const receptor = document.createElement('touch-receptor');
      receptor.setAttribute('label', `${size.charAt(0).toUpperCase() + size.slice(1)}`);
      receptor.setAttribute('variant', 'primary');
      receptor.setAttribute('size', size);
      container.appendChild(receptor);
    });

    return container;
  },
};

/**
 * Form example with multiple buttons
 */
export const FormExample: Story = {
  render: () => {
    const form = document.createElement('form');
    form.style.maxWidth = '400px';
    form.style.padding = '2rem';
    form.style.border = '1px solid #e2e8f0';
    form.style.borderRadius = '8px';

    const title = document.createElement('h3');
    title.textContent = 'Confirm Action';
    title.style.marginTop = '0';

    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to proceed with this action?';
    message.style.color = '#64748b';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '1rem';
    buttonContainer.style.marginTop = '1.5rem';

    const cancelButton = document.createElement('touch-receptor');
    cancelButton.setAttribute('label', 'Cancel');
    cancelButton.setAttribute('variant', 'ghost');
    cancelButton.setAttribute('size', 'medium');

    const confirmButton = document.createElement('touch-receptor');
    confirmButton.setAttribute('label', 'Confirm');
    confirmButton.setAttribute('variant', 'primary');
    confirmButton.setAttribute('size', 'medium');

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);

    form.appendChild(title);
    form.appendChild(message);
    form.appendChild(buttonContainer);

    // Add event handlers
    cancelButton.addEventListener('touch', () => {
      alert('Action cancelled');
    });

    confirmButton.addEventListener('touch', () => {
      alert('Action confirmed');
    });

    return form;
  },
};

/**
 * Loading state simulation
 */
export const LoadingSimulation: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '2rem';

    const receptor = document.createElement('touch-receptor');
    receptor.setAttribute('label', 'Submit');
    receptor.setAttribute('variant', 'primary');
    receptor.setAttribute('size', 'medium');

    receptor.addEventListener('touch', () => {
      // Simulate async operation
      receptor.setAttribute('loading', '');
      receptor.setAttribute('label', 'Submitting...');

      setTimeout(() => {
        receptor.removeAttribute('loading');
        receptor.setAttribute('label', 'Success!');
        receptor.setAttribute('variant', 'secondary');

        setTimeout(() => {
          receptor.setAttribute('label', 'Submit');
          receptor.setAttribute('variant', 'primary');
        }, 2000);
      }, 2000);
    });

    container.appendChild(receptor);

    return container;
  },
};

/**
 * Keyboard navigation demonstration
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '2rem';

    const instructions = document.createElement('p');
    instructions.textContent = 'Use Tab to navigate between buttons, Enter or Space to activate';
    instructions.style.color = '#64748b';
    instructions.style.marginBottom = '1rem';

    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = '1rem';

    for (let i = 1; i <= 3; i++) {
      const receptor = document.createElement('touch-receptor');
      receptor.setAttribute('label', `Button ${i}`);
      receptor.setAttribute('variant', 'primary');
      receptor.setAttribute('size', 'medium');

      receptor.addEventListener('touch', () => {
        alert(`Button ${i} activated`);
      });

      buttonRow.appendChild(receptor);
    }

    container.appendChild(instructions);
    container.appendChild(buttonRow);

    return container;
  },
};
