/**
 * Alert Component - Feedback messages
 */

import { VisualNeuron } from '../VisualNeuron';
import type { RenderSignal } from '../types';

export interface AlertProps {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export interface AlertState {
  visible: boolean;
  hovered: boolean;
}

export class Alert extends VisualNeuron<AlertProps, AlertState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    if (!state.visible) {
      return {
        type: 'render',
        data: {
          vdom: {
            tag: 'div',
            props: { style: 'display: none;' },
            children: [],
          },
          styles: {},
          metadata: {
            componentId: this.id,
            renderCount: this.getRenderCount(),
            lastRenderTime: Date.now(),
          },
        },
        strength: 0,
        timestamp: Date.now(),
      };
    }

    const variant = props.variant ?? 'info';

    const children: Array<
      string | { tag: string; props?: Record<string, unknown>; children: string[] }
    > = [];

    if (props.title !== undefined && props.title !== '') {
      children.push({
        tag: 'strong',
        props: {
          className: 'alert-title',
          style: 'display: block; margin-bottom: 4px; font-weight: 600;',
        },
        children: [props.title],
      });
    }

    children.push({
      tag: 'span',
      props: { className: 'alert-message' },
      children: [props.message],
    });

    if (props.dismissible ?? false) {
      children.push({
        tag: 'button',
        props: {
          className: 'alert-dismiss',
          'aria-label': 'Dismiss',
          style:
            'position: absolute; top: 12px; right: 12px; background: none; border: none; cursor: pointer; font-size: 20px; line-height: 1; color: inherit; opacity: 0.6; padding: 0; width: 20px; height: 20px;',
        },
        children: ['×'],
      });
    }

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: {
            className: `alert alert-${variant} ${state.hovered ? 'hovered' : ''}`,
            role: 'alert',
            'aria-live': 'polite',
          },
          children,
        },
        styles: {
          position: 'relative',
          padding: (props.dismissible ?? false) ? '12px 40px 12px 16px' : '12px 16px',
          marginBottom: '16px',
          borderRadius: '4px',
          backgroundColor: this.getBackgroundColor(variant),
          color: this.getTextColor(variant),
          border: `1px solid ${this.getBorderColor(variant)}`,
          transition: 'all 0.2s',
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

  private getBackgroundColor(variant: string): string {
    const colors: Record<string, string> = {
      info: '#d1ecf1',
      success: '#d4edda',
      warning: '#fff3cd',
      danger: '#f8d7da',
    };

    return colors[variant] ?? colors['info'] ?? '#d1ecf1';
  }

  private getTextColor(variant: string): string {
    const colors: Record<string, string> = {
      info: '#0c5460',
      success: '#155724',
      warning: '#856404',
      danger: '#721c24',
    };

    return colors[variant] ?? colors['info'] ?? '#0c5460';
  }

  private getBorderColor(variant: string): string {
    const colors: Record<string, string> = {
      info: '#bee5eb',
      success: '#c3e6cb',
      warning: '#ffeaa7',
      danger: '#f5c6cb',
    };

    return colors[variant] ?? colors['info'] ?? '#bee5eb';
  }
}
