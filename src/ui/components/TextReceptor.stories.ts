import type { Meta, StoryObj } from '@storybook/html';
import { TextReceptor, type TextReceptorProps } from './TextReceptor';

const meta: Meta<TextReceptorProps> = {
  title: 'Components/TextReceptor',
  tags: ['autodocs'],
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = '20px';

    const input = new TextReceptor({
      id: `input-${crypto.randomUUID()}`,
      type: 'reflex',
      threshold: 0.5,
      props: args,
      initialState: {
        focused: false,
        value: args.value,
        hasError: (args.error ?? '') !== '',
      },
    });

    void input.activate();

    const renderSignal = input['performRender']();
    const vdom = renderSignal.data.vdom;

    const wrapper = document.createElement(vdom.tag);
    if (typeof vdom.props === 'object' && vdom.props !== null && 'className' in vdom.props) {
      wrapper.className = vdom.props['className'] as string;
    }

    if (vdom.children) {
      vdom.children.forEach((child) => {
        if (typeof child === 'string' && child !== '') {
          wrapper.appendChild(document.createTextNode(child));
        } else if (typeof child === 'object' && child !== null && 'tag' in child) {
          const element = document.createElement(child.tag);

          if (typeof child.props === 'object' && child.props !== null) {
            Object.entries(child.props).forEach(([key, value]) => {
              if (key === 'className') {
                element.className = value as string;
              } else {
                element.setAttribute(key, String(value));
              }
            });
          }

          if ('children' in child && Array.isArray(child.children)) {
            child.children.forEach((text) => {
              if (typeof text === 'string') {
                element.textContent = text;
              }
            });
          }

          if (child.tag === 'input') {
            element.addEventListener('input', (e) => {
              const target = e.target as HTMLInputElement;
              args.onChange(target.value);
            });
          }

          wrapper.appendChild(element);
        }
      });
    }

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      const inputElement = wrapper.querySelector('input');
      if (inputElement !== null) {
        inputElement.style[key as any] = String(value);
      }
    });

    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '8px';

    container.appendChild(wrapper);
    return container;
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
  },
};

export default meta;
type Story = StoryObj<TextReceptorProps>;

export const Text: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    value: '',
    label: 'Text Input',
    onChange: (value: string) => console.log('Value changed:', value),
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'user@example.com',
    value: '',
    label: 'Email',
    onChange: (value: string) => console.log('Email changed:', value),
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
    value: '',
    label: 'Password',
    onChange: (value: string) => console.log('Password changed:', value),
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    value: '',
    label: 'Number',
    onChange: (value: string) => console.log('Number changed:', value),
  },
};

export const WithValue: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    value: 'Pre-filled value',
    label: 'Input with value',
    onChange: (value: string) => console.log('Value changed:', value),
  },
};

export const WithError: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    value: 'invalid@',
    label: 'Email',
    error: 'Please enter a valid email address',
    onChange: (value: string) => console.log('Value changed:', value),
  },
};

export const Disabled: Story = {
  args: {
    type: 'text',
    placeholder: 'Cannot edit',
    value: 'Disabled value',
    label: 'Disabled Input',
    disabled: true,
    onChange: (value: string) => console.log('Value changed:', value),
  },
};
