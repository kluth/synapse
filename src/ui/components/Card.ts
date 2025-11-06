/**
 * Card Component - Container for content grouping
 */

import { InterneuronUI } from '../InterneuronUI';
import type { RenderSignal } from '../types';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: string;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
  hoverable?: boolean;
}

export interface CardState {
  hovered: boolean;
  pressed: boolean;
}

export class Card extends InterneuronUI<CardProps, CardState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    const variant = props.variant ?? 'default';
    const padding = props.padding ?? 'medium';

    const children: Array<{ tag: string; props?: Record<string, unknown>; children: string[] }> =
      [];

    if (props.title !== undefined && props.title !== '') {
      children.push({
        tag: 'h3',
        props: {
          className: 'card-title',
          style: 'margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600;',
        },
        children: [props.title],
      });
    }

    if (props.subtitle !== undefined && props.subtitle !== '') {
      children.push({
        tag: 'p',
        props: {
          className: 'card-subtitle',
          style: 'margin: 0 0 0.75rem 0; font-size: 0.875rem; color: #6c757d;',
        },
        children: [props.subtitle],
      });
    }

    children.push({
      tag: 'div',
      props: {
        className: 'card-content',
      },
      children: [props.children],
    });

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: {
            className: `card card-${variant} ${state.hovered ? 'hovered' : ''} ${state.pressed ? 'pressed' : ''} ${(props.hoverable ?? false) ? 'hoverable' : ''}`,
            'aria-label': props.title ?? 'Card',
            role: props.onClick !== undefined ? 'button' : undefined,
            tabindex: props.onClick !== undefined ? '0' : undefined,
          },
          children,
        },
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: this.getPadding(padding),
          border: variant === 'outlined' ? '1px solid #dee2e6' : 'none',
          boxShadow: this.getBoxShadow(variant, state.hovered, state.pressed),
          transition: 'all 0.2s ease-in-out',
          cursor: props.onClick !== undefined ? 'pointer' : 'default',
          transform:
            state.pressed && props.onClick !== undefined
              ? 'scale(0.98)'
              : (props.hoverable ?? false) && state.hovered
                ? 'translateY(-2px)'
                : 'none',
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

  private getPadding(padding: string): string {
    const paddings: Record<string, string> = {
      none: '0',
      small: '12px',
      medium: '20px',
      large: '32px',
    };

    return paddings[padding] ?? paddings['medium'] ?? '20px';
  }

  private getBoxShadow(variant: string, hovered: boolean, pressed: boolean): string {
    if (pressed) {
      return '0 1px 3px rgba(0, 0, 0, 0.12)';
    }

    if (variant === 'elevated') {
      return hovered ? '0 8px 16px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)';
    }

    if (variant === 'outlined') {
      return hovered ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none';
    }

    return hovered ? '0 4px 12px rgba(0, 0, 0, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.08)';
  }
}
