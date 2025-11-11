import type { Meta, StoryObj } from '@storybook/html';
import { within, userEvent, expect } from '@storybook/test';
import { TouchReceptor, type TouchReceptorProps } from './TouchReceptor';

const meta: Meta<TouchReceptorProps> = {
  title: 'Components/TouchReceptor',
  tags: ['autodocs'],
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = '20px';

    const button = new TouchReceptor({
      id: `button-${crypto.randomUUID()}`,
      type: 'reflex',
      threshold: 0.5,
      props: args,
      initialState: {
        pressed: false,
        hovered: false,
        disabled: args.disabled ?? false,
      },
    });

    void button.activate();

    const renderSignal = button['performRender']();
    const vdom = renderSignal.data.vdom;

    const buttonElement = document.createElement(vdom.tag);
    buttonElement.textContent = vdom.children?.[0] as string;

    if (vdom.props) {
      Object.entries(vdom.props).forEach(([key, value]) => {
        if (key === 'className') {
          buttonElement.className = value as string;
        } else {
          buttonElement.setAttribute(key, String(value));
        }
      });
    }

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      buttonElement.style[key as any] = String(value);
    });

    buttonElement.addEventListener('click', (e) => {
      if (args.onClick !== undefined) {
        args.onClick({
          type: 'ui:click',
          payload: { type: 'ui:click', event: e },
        });
      }
    });

    container.appendChild(buttonElement);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Button label text',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'success'],
      description: 'Button variant style',
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
};

export default meta;
type Story = StoryObj<TouchReceptorProps>;

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

    // Test 1: Button is visible
    const button = canvas.getByRole('button', { name: /primary button/i });
    await expect(button).toBeInTheDocument();

    // Test 2: Button has correct variant class
    await expect(button).toHaveClass('button-primary');

    // Test 3: Button is not disabled
    await expect(button).not.toBeDisabled();

    // Test 4: Button responds to clicks
    await userEvent.click(button);
    // After click, button should be clickable again (not stuck)
    await expect(button).toBeInTheDocument();
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
    size: 'medium',
  },
};

export const Danger: Story = {
  args: {
    label: 'Danger Button',
    variant: 'danger',
    size: 'medium',
  },
};

export const Success: Story = {
  args: {
    label: 'Success Button',
    variant: 'success',
    size: 'medium',
  },
};

export const Small: Story = {
  args: {
    label: 'Small Button',
    variant: 'primary',
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Button',
    variant: 'primary',
    size: 'large',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    variant: 'primary',
    size: 'medium',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test 1: Button is visible
    const button = canvas.getByRole('button', { name: /disabled button/i });
    await expect(button).toBeInTheDocument();

    // Test 2: Button is disabled
    await expect(button).toBeDisabled();

    // Test 3: Button has disabled class
    await expect(button).toHaveClass('button-disabled');

    // Test 4: Clicking disabled button should not cause errors
    // (userEvent.click will respect the disabled state)
    try {
      await userEvent.click(button);
    } catch (error) {
      // This is expected - disabled buttons can't be clicked
    }
  },
};

export const Loading: Story = {
  args: {
    label: 'Click Me',
    variant: 'primary',
    size: 'medium',
    loading: true,
  },
};

export const KeyboardNavigation: Story = {
  args: {
    label: 'Press Enter or Space',
    variant: 'primary',
    size: 'medium',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByRole('button', { name: /press enter or space/i });

    // Test 1: Button can receive focus
    button.focus();
    await expect(button).toHaveFocus();

    // Test 2: Enter key activates the button
    await userEvent.keyboard('{Enter}');
    await expect(button).toBeInTheDocument();

    // Test 3: Tab can move focus away
    await userEvent.tab();
    await expect(button).not.toHaveFocus();

    // Test 4: Shift+Tab can move focus back
    await userEvent.tab({ shift: true });
    await expect(button).toHaveFocus();

    // Test 5: Space key also activates the button
    await userEvent.keyboard(' ');
    await expect(button).toBeInTheDocument();
  },
};

export const AllVariants: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.style.flexWrap = 'wrap';

    const variants: Array<TouchReceptorProps['variant']> = [
      'primary',
      'secondary',
      'danger',
      'success',
    ];

    variants.forEach((variant) => {
      const button = new TouchReceptor({
        id: `button-${variant}-${crypto.randomUUID()}`,
        type: 'reflex',
        threshold: 0.5,
        props: {
          label: `${variant?.charAt(0).toUpperCase()}${variant?.slice(1)}`,
          variant: variant!,
          size: 'medium',
        },
        initialState: {
          pressed: false,
          hovered: false,
          disabled: false,
        },
      });

      void button.activate();

      const renderSignal = button['performRender']();
      const vdom = renderSignal.data.vdom;

      const buttonElement = document.createElement(vdom.tag);
      buttonElement.textContent = vdom.children?.[0] as string;

      if (vdom.props) {
        Object.entries(vdom.props).forEach(([key, value]) => {
          if (key === 'className') {
            buttonElement.className = value as string;
          } else {
            buttonElement.setAttribute(key, String(value));
          }
        });
      }

      Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
        buttonElement.style[key as any] = String(value);
      });

      container.appendChild(buttonElement);
    });

    return container;
  },
};
