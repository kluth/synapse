import type { Meta, StoryObj } from '@storybook/html';
import { Text, type TextProps } from './Text';

const meta: Meta<TextProps> = {
  title: 'Components/Text',
  tags: ['autodocs'],
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = '20px';

    const text = new Text({
      id: `text-${crypto.randomUUID()}`,
      type: 'reflex',
      threshold: 0.5,
      props: args,
      initialState: {
        hovered: false,
      },
    });

    void text.activate();

    const renderSignal = text['performRender']();
    const vdom = renderSignal.data.vdom;

    const element = document.createElement(vdom.tag);
    if (vdom.children) {
      element.textContent = vdom.children?.[0] as string;
    }

    if (vdom.props) {
      Object.entries(vdom.props).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value as string;
        } else {
          element.setAttribute(key, String(value));
        }
      });
    }

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      element.style[key as any] = String(value);
    });

    container.appendChild(element);
    return container;
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Text content',
    },
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption', 'label'],
      description: 'Text variant',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'muted'],
      description: 'Text color',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment',
    },
    weight: {
      control: 'select',
      options: ['light', 'normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight',
    },
    italic: {
      control: 'boolean',
      description: 'Italic text',
    },
    underline: {
      control: 'boolean',
      description: 'Underlined text',
    },
    noWrap: {
      control: 'boolean',
      description: 'Prevent text wrapping',
    },
  },
};

export default meta;
type Story = StoryObj<TextProps>;

export const Heading1: Story = {
  args: {
    children: 'Heading 1',
    variant: 'h1',
  },
};

export const Heading2: Story = {
  args: {
    children: 'Heading 2',
    variant: 'h2',
  },
};

export const Heading3: Story = {
  args: {
    children: 'Heading 3',
    variant: 'h3',
  },
};

export const Body: Story = {
  args: {
    children:
      'This is a body text paragraph. It provides regular text content for the application.',
    variant: 'body',
  },
};

export const Caption: Story = {
  args: {
    children: 'This is a caption text - smaller and subtle',
    variant: 'caption',
  },
};

export const Label: Story = {
  args: {
    children: 'Label Text',
    variant: 'label',
    weight: 'medium',
  },
};

export const ColorVariants: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const colors: Array<TextProps['color']> = [
      'primary',
      'secondary',
      'success',
      'danger',
      'muted',
    ];

    colors.forEach((color) => {
      const text = new Text({
        id: `text-${color}-${crypto.randomUUID()}`,
        type: 'reflex',
        threshold: 0.5,
        props: {
          children: `${color?.charAt(0).toUpperCase()}${color?.slice(1)} text color`,
          color: color!,
          variant: 'body',
        },
        initialState: {
          hovered: false,
        },
      });

      void text.activate();

      const renderSignal = text['performRender']();
      const vdom = renderSignal.data.vdom;

      const element = document.createElement(vdom.tag);
      if (vdom.children) {
        element.textContent = vdom.children?.[0] as string;
      }

      if (vdom.props) {
        Object.entries(vdom.props).forEach(([key, value]) => {
          if (key === 'className') {
            element.className = value as string;
          } else {
            element.setAttribute(key, String(value));
          }
        });
      }

      Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
        element.style[key as any] = String(value);
      });

      container.appendChild(element);
    });

    return container;
  },
};

export const WeightVariants: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const weights: Array<TextProps['weight']> = ['light', 'normal', 'medium', 'semibold', 'bold'];

    weights.forEach((weight) => {
      const text = new Text({
        id: `text-${weight}-${crypto.randomUUID()}`,
        type: 'reflex',
        threshold: 0.5,
        props: {
          children: `${weight?.charAt(0).toUpperCase()}${weight?.slice(1)} font weight`,
          weight: weight!,
          variant: 'body',
        },
        initialState: {
          hovered: false,
        },
      });

      void text.activate();

      const renderSignal = text['performRender']();
      const vdom = renderSignal.data.vdom;

      const element = document.createElement(vdom.tag);
      if (vdom.children) {
        element.textContent = vdom.children?.[0] as string;
      }

      if (vdom.props) {
        Object.entries(vdom.props).forEach(([key, value]) => {
          if (key === 'className') {
            element.className = value as string;
          } else {
            element.setAttribute(key, String(value));
          }
        });
      }

      Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
        element.style[key as any] = String(value);
      });

      container.appendChild(element);
    });

    return container;
  },
};

export const Italic: Story = {
  args: {
    children: 'This is italic text',
    variant: 'body',
    italic: true,
  },
};

export const Underlined: Story = {
  args: {
    children: 'This is underlined text',
    variant: 'body',
    underline: true,
  },
};

export const NoWrap: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.width = '200px';
    container.style.border = '1px solid #ccc';

    const text = new Text({
      id: `text-nowrap-${crypto.randomUUID()}`,
      type: 'reflex',
      threshold: 0.5,
      props: {
        children: 'This is a very long text that should not wrap to the next line',
        variant: 'body',
        noWrap: true,
      },
      initialState: {
        hovered: false,
      },
    });

    void text.activate();

    const renderSignal = text['performRender']();
    const vdom = renderSignal.data.vdom;

    const element = document.createElement(vdom.tag);
    if (vdom.children) {
      element.textContent = vdom.children?.[0] as string;
    }

    if (vdom.props) {
      Object.entries(vdom.props).forEach(([key, value]) => {
        if (key === 'className') {
          element.className = value as string;
        } else {
          element.setAttribute(key, String(value));
        }
      });
    }

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      element.style[key as any] = String(value);
    });

    container.appendChild(element);
    return container;
  },
};
