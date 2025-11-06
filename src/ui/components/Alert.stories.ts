import type { Meta, StoryObj } from '@storybook/html';
import { Alert, type AlertProps } from './Alert';

const meta: Meta = {
  title: 'Components/Alert',
  tags: ['autodocs'],
  render: (args: AlertProps) => {
    const container = document.createElement('div');
    container.style.padding = '20px';

    const alert = new Alert({
      id: `alert-${crypto.randomUUID()}`,
      config: {
        initialProps: args,
        initialState: {
          visible: true,
          hovered: false,
        },
      },
    });

    void alert.activate();

    const renderSignal = alert['performRender']();
    const vdom = renderSignal.data.vdom;

    const alertElement = document.createElement(vdom.tag);

    Object.entries(vdom.props).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'className') {
        alertElement.className = value as string;
      } else {
        alertElement.setAttribute(key, String(value));
      }
    });

    Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
      alertElement.style[key as never] = value;
    });

    vdom.children.forEach((child) => {
      if (typeof child === 'string') {
        alertElement.appendChild(document.createTextNode(child));
      } else if (typeof child === 'object' && 'tag' in child) {
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

        if (child.tag === 'button') {
          element.addEventListener('click', () => {
            alert.setState({ visible: false });
            alertElement.style.display = 'none';
            if (args.onDismiss !== undefined) {
              args.onDismiss();
            }
          });
        }

        alertElement.appendChild(element);
      }
    });

    container.appendChild(alertElement);
    return container;
  },
  argTypes: {
    message: {
      control: 'text',
      description: 'Alert message',
    },
    title: {
      control: 'text',
      description: 'Alert title',
    },
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
      description: 'Alert variant',
    },
    dismissible: {
      control: 'boolean',
      description: 'Allow dismissing the alert',
    },
  },
};

export default meta;
type Story = StoryObj<AlertProps>;

export const Info: Story = {
  args: {
    message: 'This is an informational alert message.',
    variant: 'info',
  },
};

export const Success: Story = {
  args: {
    message: 'Your action completed successfully!',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    message: 'Please be careful with this action.',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    message: 'An error occurred. Please try again.',
    variant: 'danger',
  },
};

export const WithTitle: Story = {
  args: {
    title: 'Important Notice',
    message: 'This alert has a title to draw attention to important information.',
    variant: 'info',
  },
};

export const Dismissible: Story = {
  args: {
    title: 'Dismissible Alert',
    message: 'You can dismiss this alert by clicking the X button.',
    variant: 'success',
    dismissible: true,
    onDismiss: () => console.log('Alert dismissed'),
  },
};

export const AllVariants: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '16px';

    const alerts: Array<{ variant: AlertProps['variant']; message: string; title: string }> = [
      { variant: 'info', title: 'Info', message: 'This is an informational alert.' },
      { variant: 'success', title: 'Success', message: 'Operation completed successfully!' },
      { variant: 'warning', title: 'Warning', message: 'Please proceed with caution.' },
      { variant: 'danger', title: 'Error', message: 'An error occurred.' },
    ];

    alerts.forEach((alertData) => {
      const alert = new Alert({
        id: `alert-${alertData.variant}-${crypto.randomUUID()}`,
        config: {
          initialProps: {
            title: alertData.title,
            message: alertData.message,
            variant: alertData.variant,
            dismissible: true,
          },
          initialState: {
            visible: true,
            hovered: false,
          },
        },
      });

      void alert.activate();

      const renderSignal = alert['performRender']();
      const vdom = renderSignal.data.vdom;

      const alertElement = document.createElement(vdom.tag);

      Object.entries(vdom.props).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key === 'className') {
          alertElement.className = value as string;
        } else {
          alertElement.setAttribute(key, String(value));
        }
      });

      Object.entries(renderSignal.data.styles).forEach(([key, value]) => {
        alertElement.style[key as never] = value;
      });

      vdom.children.forEach((child) => {
        if (typeof child === 'string') {
          alertElement.appendChild(document.createTextNode(child));
        } else if (typeof child === 'object' && 'tag' in child) {
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

          if (child.tag === 'button') {
            element.addEventListener('click', () => {
              alert.setState({ visible: false });
              alertElement.style.display = 'none';
            });
          }

          alertElement.appendChild(element);
        }
      });

      container.appendChild(alertElement);
    });

    return container;
  },
};
