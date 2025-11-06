/**
 * Modal Component - Overlay dialog
 */

import { InterneuronUI } from '../InterneuronUI';
import type { RenderSignal } from '../types';

export interface ModalProps {
  title: string;
  children: string;
  isOpen: boolean;
  onClose: () => void;
  size?: 'small' | 'medium' | 'large';
  showCloseButton?: boolean;
}

export interface ModalState {
  isOpen: boolean;
}

export class Modal extends InterneuronUI<ModalProps, ModalState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    if (!state.isOpen) {
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

    const size = props.size ?? 'medium';

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: {
            className: 'modal-overlay',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'modal-title',
          },
          children: [
            {
              tag: 'div',
              props: {
                className: `modal-content modal-${size}`,
                style: `background: white; border-radius: 8px; padding: 24px; position: relative; width: ${this.getWidth(size)}; max-width: 90vw; max-height: 90vh; overflow: auto; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);`,
              },
              children: [
                {
                  tag: 'div',
                  props: {
                    className: 'modal-header',
                    style: 'margin-bottom: 16px; padding-right: 24px;',
                  },
                  children: [
                    {
                      tag: 'h2',
                      props: {
                        id: 'modal-title',
                        className: 'modal-title',
                        style: 'margin: 0; font-size: 1.5rem; font-weight: 600;',
                      },
                      children: [props.title],
                    },
                  ],
                },
                (props.showCloseButton ?? true)
                  ? {
                      tag: 'button',
                      props: {
                        className: 'modal-close',
                        'aria-label': 'Close',
                        style:
                          'position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #6c757d; line-height: 1;',
                      },
                      children: ['×'],
                    }
                  : '',
                {
                  tag: 'div',
                  props: {
                    className: 'modal-body',
                    style: 'margin-bottom: 16px; color: #212529;',
                  },
                  children: [props.children],
                },
              ],
            },
          ],
        },
        styles: {
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000',
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

  private getWidth(size: string): string {
    const widths: Record<string, string> = {
      small: '400px',
      medium: '600px',
      large: '800px',
    };

    return widths[size] ?? widths['medium'] ?? '600px';
  }
}
