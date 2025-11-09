/**
 * Example Button Component for Theater Demo
 *
 * This is a simple button component used to demonstrate
 * The Anatomy Theater's capabilities.
 */

import type { VisualNeuronConfig } from '../../src/ui/VisualNeuron';
import { VisualNeuron } from '../../src/ui/VisualNeuron';
import type { RenderSignal } from '../../src/ui/types';

export interface ButtonComponentProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

export interface ButtonComponentState {
  pressed: boolean;
  clickCount: number;
}

export class ButtonComponent extends VisualNeuron<ButtonComponentProps, ButtonComponentState> {
  constructor(config: VisualNeuronConfig<ButtonComponentProps>) {
    super({
      ...config,
      initialState: {
        pressed: false,
        clickCount: 0,
      },
    });
  }

  protected override shouldUpdate(nextProps: ButtonComponentProps): boolean {
    return (
      this.receptiveField.label !== nextProps.label ||
      this.receptiveField.variant !== nextProps.variant ||
      this.receptiveField.disabled !== nextProps.disabled
    );
  }

  protected getStyles(): Record<string, unknown> {
    const { variant = 'primary', disabled } = this.receptiveField;
    const { pressed } = this.visualState;

    const baseStyles = {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: disabled === true ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      opacity: disabled === true ? 0.5 : 1,
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
    if (this.receptiveField.disabled === true) {
      return;
    }

    this.setState({
      pressed: true,
      clickCount: this.visualState.clickCount + 1,
    });

    // Reset pressed state after a short delay
    setTimeout(() => {
      this.setState({ pressed: false });
    }, 100);

    // Call onClick handler if provided
    this.receptiveField.onClick?.();

    // Emit neural signal
    this.emitUIEvent({
      type: 'ui:click',
      data: {
        payload: {
          clickCount: this.visualState.clickCount + 1,
        },
        target: this.id,
      },
      strength: 1.0,
      timestamp: Date.now(),
    });
  }

  protected override performRender(): RenderSignal {
    const { label } = this.receptiveField;
    const styles = this.getStyles();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'button',
          props: {
            style: styles,
            onClick: () => this.handleClick(),
          },
          children: [label],
        },
        styles: {},
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: this.getLastRenderTime(),
        },
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}
