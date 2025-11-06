import type { Meta, StoryObj } from '@storybook/html';
import { Card, type CardProps } from './Card';

const meta: Meta = {
  title: 'Components/Card',
  tags: ['autodocs'],
  render: (args: CardProps) => {
    const container = document.createElement('div');
    container.style.padding = '20px';

    const card = new Card({
      id: `card-${crypto.randomUUID()}`,
      config: {
        initialProps: args,
        initialState: {
          hovered: false,
          pressed: false,
        },
      },
    });

    void card.activate();

    const renderSignal = card['performRender']();
    const vdom = renderSignal.data.vdom;

    const cardElement = document.createElement(vdom.tag);

    Object.entries(vdom.props).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'className') {
        cardElement.className = value as string;
      } else {
        cardElement.setAttribute(key, String(value));
      }
    });

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      cardElement.style[key as never] = value;
    });

    vdom.children.forEach((child) => {
      if (typeof child === 'object' && 'tag' in child) {
        const element = document.createElement(child.tag);

        if (child.props !== undefined) {
          Object.entries(child.props).forEach(([key, value]) => {
            if (key === 'className') {
              element.className = value as string;
            } else if (key === 'style') {
              element.setAttribute('style', value as string);
            } else {
              element.setAttribute(key, String(value));
            }
          });
        }

        if (child.children !== undefined) {
          element.textContent = child.children.join('');
        }

        cardElement.appendChild(element);
      }
    });

    if (args.onClick !== undefined) {
      cardElement.addEventListener('click', args.onClick);
      cardElement.addEventListener('mouseenter', () => {
        card.setState({ hovered: true });
        const updated = card['performRender']();
        Object.entries(updated.data.styles).forEach(([key, value]) => {
          cardElement.style[key as never] = value;
        });
      });
      cardElement.addEventListener('mouseleave', () => {
        card.setState({ hovered: false, pressed: false });
        const updated = card['performRender']();
        Object.entries(updated.data.styles).forEach(([key, value]) => {
          cardElement.style[key as never] = value;
        });
      });
    }

    container.appendChild(cardElement);
    return container;
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title',
    },
    subtitle: {
      control: 'text',
      description: 'Card subtitle',
    },
    children: {
      control: 'text',
      description: 'Card content',
    },
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
      description: 'Card variant',
    },
    padding: {
      control: 'select',
      options: ['none', 'small', 'medium', 'large'],
      description: 'Card padding',
    },
    hoverable: {
      control: 'boolean',
      description: 'Add hover effect',
    },
  },
};

export default meta;
type Story = StoryObj<CardProps>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    subtitle: 'Card subtitle',
    children:
      'This is the card content. It can contain any text or other content you want to display.',
    variant: 'default',
    padding: 'medium',
  },
};

export const Outlined: Story = {
  args: {
    title: 'Outlined Card',
    subtitle: 'With border',
    children: 'This card has a border instead of a shadow.',
    variant: 'outlined',
    padding: 'medium',
  },
};

export const Elevated: Story = {
  args: {
    title: 'Elevated Card',
    subtitle: 'With shadow',
    children: 'This card has an elevated appearance with a prominent shadow.',
    variant: 'elevated',
    padding: 'medium',
  },
};

export const SmallPadding: Story = {
  args: {
    title: 'Small Padding',
    children: 'This card has small padding.',
    variant: 'default',
    padding: 'small',
  },
};

export const LargePadding: Story = {
  args: {
    title: 'Large Padding',
    children: 'This card has large padding.',
    variant: 'default',
    padding: 'large',
  },
};

export const WithoutTitle: Story = {
  args: {
    children: 'This card has no title, just content.',
    variant: 'default',
    padding: 'medium',
  },
};

export const Hoverable: Story = {
  args: {
    title: 'Hoverable Card',
    subtitle: 'Try hovering over me',
    children: 'This card lifts up when you hover over it.',
    variant: 'elevated',
    padding: 'medium',
    hoverable: true,
  },
};

export const Clickable: Story = {
  args: {
    title: 'Clickable Card',
    subtitle: 'Click me!',
    children: 'This card is clickable and will log to the console.',
    variant: 'default',
    padding: 'medium',
    onClick: () => console.log('Card clicked!'),
  },
};

export const CardGrid: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    container.style.gap = '20px';

    const cards = [
      { title: 'Card 1', subtitle: 'First card', content: 'Content for the first card' },
      { title: 'Card 2', subtitle: 'Second card', content: 'Content for the second card' },
      { title: 'Card 3', subtitle: 'Third card', content: 'Content for the third card' },
    ];

    cards.forEach((cardData) => {
      const card = new Card({
        id: `card-grid-${crypto.randomUUID()}`,
        config: {
          initialProps: {
            title: cardData.title,
            subtitle: cardData.subtitle,
            children: cardData.content,
            variant: 'elevated',
            padding: 'medium',
            hoverable: true,
          },
          initialState: {
            hovered: false,
            pressed: false,
          },
        },
      });

      void card.activate();

      const renderSignal = card['performRender']();
      const vdom = renderSignal.data.vdom;

      const cardElement = document.createElement(vdom.tag);

      Object.entries(vdom.props).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key === 'className') {
          cardElement.className = value as string;
        } else {
          cardElement.setAttribute(key, String(value));
        }
      });

      Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
        cardElement.style[key as never] = value;
      });

      vdom.children.forEach((child) => {
        if (typeof child === 'object' && 'tag' in child) {
          const element = document.createElement(child.tag);

          if (child.props !== undefined) {
            Object.entries(child.props).forEach(([key, value]) => {
              if (key === 'className') {
                element.className = value as string;
              } else if (key === 'style') {
                element.setAttribute('style', value as string);
              } else {
                element.setAttribute(key, String(value));
              }
            });
          }

          if (child.children !== undefined) {
            element.textContent = child.children.join('');
          }

          cardElement.appendChild(element);
        }
      });

      container.appendChild(cardElement);
    });

    return container;
  },
};
