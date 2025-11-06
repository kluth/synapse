/**
 * Text Component - Typography display element
 */

import { VisualNeuron } from '../VisualNeuron';
import type { RenderSignal } from '../types';

export interface TextProps {
  children: string;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'muted';
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  italic?: boolean;
  underline?: boolean;
  noWrap?: boolean;
}

export interface TextState {
  hovered: boolean;
}

export class Text extends VisualNeuron<TextProps, TextState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    const variant = props.variant ?? 'body';
    const color = props.color ?? 'primary';
    const align = props.align ?? 'left';
    const weight = props.weight ?? 'normal';

    const tag = this.getTag(variant);

    return {
      type: 'render',
      data: {
        vdom: {
          tag,
          props: {
            className: `text text-${variant} text-${color} ${state.hovered ? 'hovered' : ''}`,
            'aria-label': props.children,
          },
          children: [props.children],
        },
        styles: {
          color: this.getColor(color),
          fontSize: this.getFontSize(variant),
          fontWeight: this.getFontWeight(weight),
          textAlign: align,
          fontStyle: (props.italic ?? false) ? 'italic' : 'normal',
          textDecoration: (props.underline ?? false) ? 'underline' : 'none',
          whiteSpace: (props.noWrap ?? false) ? 'nowrap' : 'normal',
          overflow: (props.noWrap ?? false) ? 'hidden' : 'visible',
          textOverflow: (props.noWrap ?? false) ? 'ellipsis' : 'clip',
          margin: this.getMargin(variant),
          lineHeight: this.getLineHeight(variant),
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

  private getTag(variant: string): string {
    const tags: Record<string, string> = {
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      h4: 'h4',
      h5: 'h5',
      h6: 'h6',
      body: 'p',
      caption: 'span',
      label: 'label',
    };

    return tags[variant] ?? 'p';
  }

  private getColor(color: string): string {
    const colors: Record<string, string> = {
      primary: '#212529',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      muted: '#868e96',
    };

    return colors[color] ?? colors['primary'] ?? '#212529';
  }

  private getFontSize(variant: string): string {
    const sizes: Record<string, string> = {
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.75rem',
      h4: '1.5rem',
      h5: '1.25rem',
      h6: '1rem',
      body: '1rem',
      caption: '0.875rem',
      label: '0.875rem',
    };

    return sizes[variant] ?? sizes['body'] ?? '1rem';
  }

  private getFontWeight(weight: string): string {
    const weights: Record<string, string> = {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    };

    return weights[weight] ?? weights['normal'] ?? '400';
  }

  private getMargin(variant: string): string {
    const margins: Record<string, string> = {
      h1: '0 0 1rem 0',
      h2: '0 0 0.875rem 0',
      h3: '0 0 0.75rem 0',
      h4: '0 0 0.625rem 0',
      h5: '0 0 0.5rem 0',
      h6: '0 0 0.5rem 0',
      body: '0 0 0.5rem 0',
      caption: '0',
      label: '0',
    };

    return margins[variant] ?? margins['body'] ?? '0 0 0.5rem 0';
  }

  private getLineHeight(variant: string): string {
    const lineHeights: Record<string, string> = {
      h1: '1.2',
      h2: '1.25',
      h3: '1.3',
      h4: '1.35',
      h5: '1.4',
      h6: '1.4',
      body: '1.5',
      caption: '1.4',
      label: '1.4',
    };

    return lineHeights[variant] ?? lineHeights['body'] ?? '1.5';
  }
}
