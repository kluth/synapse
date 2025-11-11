import type { Meta, StoryObj } from '@storybook/html';
import { SelectReceptor, type SelectProps, type SelectOption } from './SelectReceptor';

const meta: Meta<SelectProps> = {
  title: 'Components/SelectReceptor',
  tags: ['autodocs'],
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = '20px';

    const select = new SelectReceptor({
      id: `select-${crypto.randomUUID()}`,
      type: 'reflex',
      threshold: 0.5,
      props: args,
      initialState: {
        open: false,
        focused: false,
        selectedValue: args.value,
      },
    });

    void select.activate();

    const renderSignal = select['performRender']();
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
            child.children.forEach((optChild) => {
              if (typeof optChild === 'string' && optChild !== '') {
                const option = document.createElement('option');
                option.textContent = optChild;
                element.appendChild(option);
              } else if (typeof optChild === 'object' && optChild !== null && 'tag' in optChild) {
                const option = document.createElement(optChild.tag);
                if (typeof optChild.props === 'object' && optChild.props !== null) {
                  Object.entries(optChild.props).forEach(([key, value]) => {
                    option.setAttribute(key, String(value));
                  });
                }
                if ('children' in optChild && Array.isArray(optChild.children)) {
                  option.textContent = (optChild.children[0] as string) ?? '';
                }
                element.appendChild(option);
              }
            });
          }

          if (child.tag === 'select') {
            element.addEventListener('change', (e) => {
              const target = e.target as HTMLSelectElement;
              args.onChange(target.value);
            });
          }

          wrapper.appendChild(element);
        }
      });
    }

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      const selectElement = wrapper.querySelector('select');
      if (selectElement !== null) {
        selectElement.style[key as any] = String(value);
      }
    });

    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '8px';

    container.appendChild(wrapper);
    return container;
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Selected value',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<SelectProps>;

const fruitOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'grape', label: 'Grape' },
  { value: 'mango', label: 'Mango' },
];

export const Default: Story = {
  args: {
    options: fruitOptions,
    value: '',
    placeholder: 'Select a fruit...',
    label: 'Fruit Selection',
    onChange: (value: string) => console.log('Selected:', value),
  },
};

export const WithValue: Story = {
  args: {
    options: fruitOptions,
    value: 'banana',
    placeholder: 'Select a fruit...',
    label: 'Pre-selected Fruit',
    onChange: (value: string) => console.log('Selected:', value),
  },
};

export const Disabled: Story = {
  args: {
    options: fruitOptions,
    value: 'apple',
    label: 'Disabled Select',
    disabled: true,
    onChange: (value: string) => console.log('Selected:', value),
  },
};

export const Countries: Story = {
  args: {
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
      { value: 'au', label: 'Australia' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
    ],
    value: '',
    placeholder: 'Select a country...',
    label: 'Country',
    onChange: (value: string) => console.log('Selected country:', value),
  },
};
