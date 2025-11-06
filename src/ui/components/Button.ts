/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
/**
 * Button Component - Primary interaction element
 */

import { SensoryNeuron } from '../SensoryNeuron';
import type { RenderSignal } from '../types';
import type { Input as NodeInput } from '../../types';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: any) => void;
}

export interface ButtonState {
  pressed: boolean;
  hovered: boolean;
  disabled: boolean;
}

export class Button extends SensoryNeuron<ButtonProps, ButtonState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    const variant = props.variant ?? 'primary';
    const size = props.size ?? 'medium';
    const disabled = (props.disabled ?? false) || state.disabled || (props.loading ?? false);

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'button',
          props: {
            disabled,
            className: `btn btn-${variant} btn-${size} ${state.pressed ? 'pressed' : ''} ${(props.loading ?? false) ? 'loading' : ''}`,
            'aria-label': props.label,
            'aria-disabled': String(disabled),
          },
          children: [(props.loading ?? false) ? 'Loading...' : props.label],
        },
        styles: {
          backgroundColor: this.getBackgroundColor(variant, disabled),
          color: this.getTextColor(variant),
          padding: this.getPadding(size),
          opacity: disabled ? 0.6 : 1.0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: 'none',
          borderRadius: '4px',
          fontSize: this.getFontSize(size),
          fontWeight: '500',
          transition: 'all 0.2s',
          transform: state.pressed ? 'scale(0.98)' : 'scale(1)',
        },
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now(),
        },
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }

  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: NodeInput<TInput>,
  ): Promise<TOutput> {
    const props = this.getProps();
    const state = this.getState();

    if ((props.disabled ?? false) || state.disabled || (props.loading ?? false)) {
      return undefined as TOutput;
    }

    // input.data can be single signal or array from processSignalQueue
    const signals: any = Array.isArray(input.data) ? input.data : [input.data];

    for (const signal of signals) {
      if (signal.type === 'ui:click' || signal?.payload?.type === 'ui:click') {
        if (props.onClick != null) {
          props.onClick(signal);
        }
      } else if (signal.type === 'ui:mousedown' || signal?.payload?.type === 'ui:mousedown') {
        this.setState({ pressed: true });
        setTimeout(() => this.setState({ pressed: false }), 150);
      } else if (signal.type === 'ui:hover' || signal?.payload?.type === 'ui:hover') {
        this.setState({ hovered: true });
      } else if (signal.type === 'ui:blur' || signal?.payload?.type === 'ui:blur') {
        this.setState({ hovered: false });
      }
    }

    return undefined as TOutput;
  }

  private getBackgroundColor(variant: string, disabled: boolean): string {
    if (disabled) return '#cccccc';

    const colors: Record<string, string> = {
      primary: '#007bff',
      secondary: '#6c757d',
      danger: '#dc3545',
      success: '#28a745',
    };

    return colors[variant] ?? colors['primary'] ?? '#007bff';
  }

  private getTextColor(_variant: string): string {
    return '#ffffff';
  }

  private getPadding(size: string): string {
    const paddings: Record<string, string> = {
      small: '4px 8px',
      medium: '8px 16px',
      large: '12px 24px',
    };

    return paddings[size] ?? paddings['medium'] ?? '8px 16px';
  }

  private getFontSize(size: string): string {
    const sizes: Record<string, string> = {
      small: '12px',
      medium: '14px',
      large: '16px',
    };

    return sizes[size] ?? sizes['medium'] ?? '14px';
  }
}
