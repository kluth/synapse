import type { Meta, StoryObj } from '@storybook/html';
import { Button, type ButtonProps } from './Button';

const meta: Meta = {
  title: 'Components/Button',
  tags: ['autodocs'],
  render: (args: ButtonProps) => {
    const container = document.createElement('div');
    container.style.padding = '20px';

    const button = new Button({
      id: `button-${crypto.randomUUID()}`,
      config: {
        initialProps: args,
        initialState: {
          pressed: false,
          hovered: false,
          disabled: args.disabled ?? false,
        },
      },
    });

    void button.activate();

    const renderSignal = button['performRender']();
    const vdom = renderSignal.data.vdom;

    const buttonElement = document.createElement(vdom.tag);
    buttonElement.textContent = vdom.children[0] as string;

    Object.entries(vdom.props).forEach(([key, value]) => {
      if (key === 'className') {
        buttonElement.className = value as string;
      } else {
        buttonElement.setAttribute(key, String(value));
      }
    });

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      buttonElement.style[key as never] = value;
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
type Story = StoryObj<ButtonProps>;

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false,
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
};

export const Loading: Story = {
  args: {
    label: 'Click Me',
    variant: 'primary',
    size: 'medium',
    loading: true,
  },
};

export const AllVariants: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.style.flexWrap = 'wrap';

    const variants: Array<ButtonProps['variant']> = ['primary', 'secondary', 'danger', 'success'];

    variants.forEach((variant) => {
      const button = new Button({
        id: `button-${variant}-${crypto.randomUUID()}`,
        config: {
          initialProps: {
            label: `${variant?.charAt(0).toUpperCase()}${variant?.slice(1)}`,
            variant,
            size: 'medium',
          },
          initialState: {
            pressed: false,
            hovered: false,
            disabled: false,
          },
        },
      });

      void button.activate();

      const renderSignal = button['performRender']();
      const vdom = renderSignal.data.vdom;

      const buttonElement = document.createElement(vdom.tag);
      buttonElement.textContent = vdom.children[0] as string;

      Object.entries(vdom.props).forEach(([key, value]) => {
        if (key === 'className') {
          buttonElement.className = value as string;
        } else {
          buttonElement.setAttribute(key, String(value));
        }
      });

      Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
        buttonElement.style[key as never] = value;
      });

      container.appendChild(buttonElement);
    });

    return container;
  },
};
