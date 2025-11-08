/**
 * Example Button Component for Theater Demo
 *
 * This is a simple button component used to demonstrate
 * The Anatomy Theater's capabilities.
 */

import { VisualNeuron } from '../../src/ui/VisualNeuron';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

export interface ButtonState {
  pressed: boolean;
  clickCount: number;
}

export class ButtonComponent extends VisualNeuron<ButtonProps, ButtonState> {
  constructor(props: ButtonProps) {
    super(props, {
      pressed: false,
      clickCount: 0,
    });
  }

  protected shouldUpdate(oldProps: ButtonProps, newProps: ButtonProps): boolean {
    return (
      oldProps.label !== newProps.label ||
      oldProps.variant !== newProps.variant ||
      oldProps.disabled !== newProps.disabled
    );
  }

  protected getStyles(): Record<string, unknown> {
    const { variant = 'primary', disabled } = this.props;
    const { pressed } = this.state;

    const baseStyles = {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      opacity: disabled ? 0.5 : 1,
    };

    const variantStyles = {
      primary: {
        background: pressed ? '#0056b3' : '#007bff',
        color: '#ffffff',
      },
      secondary: {
        background: pressed ? '#5a6268' : '#6c757d',
        color: '#ffffff',
      },
      danger: {
        background: pressed ? '#c82333' : '#dc3545',
        color: '#ffffff',
      },
    };

    return {
      ...baseStyles,
      ...variantStyles[variant],
    };
  }

  public handleClick(): void {
    if (this.props.disabled) {
      return;
    }

    this.setState({
      pressed: true,
      clickCount: this.state.clickCount + 1,
    });

    // Reset pressed state after a short delay
    setTimeout(() => {
      this.setState({ pressed: false });
    }, 100);

    // Call onClick handler if provided
    this.props.onClick?.();

    // Emit neural signal
    this.emit('clicked', {
      clickCount: this.state.clickCount + 1,
      timestamp: Date.now(),
    });
  }

  protected render(): Record<string, unknown> {
    const { label } = this.props;
    const styles = this.getStyles();

    return {
      type: 'button',
      props: {
        style: styles,
        onClick: () => this.handleClick(),
      },
      children: [label],
    };
  }
}
