/**
 * Checkbox Component - Boolean input field
 */

import { SensoryNeuron } from '../SensoryNeuron';
import type { RenderSignal } from '../types';
import type { Input as NodeInput } from '../../types';

interface UISignalPayload {
  type?: string;
  payload?: {
    type?: string;
    checked?: boolean;
  };
}

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}

export interface CheckboxState {
  checked: boolean;
  focused: boolean;
  hovered: boolean;
}

export class Checkbox extends SensoryNeuron<CheckboxProps, CheckboxState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'label',
          props: {
            className: `checkbox-wrapper ${state.focused ? 'focused' : ''} ${state.hovered ? 'hovered' : ''}`,
            style: 'display: flex; align-items: center; cursor: pointer; user-select: none;',
          },
          children: [
            {
              tag: 'input',
              props: {
                type: 'checkbox',
                checked: state.checked,
                disabled: props.disabled,
                className: `checkbox ${props.error !== undefined && props.error !== '' ? 'error' : ''}`,
                'aria-label': props.label,
                'aria-invalid': String(props.error !== undefined && props.error !== ''),
                style:
                  'width: 18px; height: 18px; margin-right: 8px; cursor: pointer; accent-color: #007bff;',
              },
            },
            {
              tag: 'span',
              props: {
                className: 'checkbox-label',
                style: `color: ${(props.disabled ?? false) ? '#adb5bd' : '#212529'}; font-size: 14px;`,
              },
              children: [props.label],
            },
          ],
        },
        styles: {
          opacity: (props.disabled ?? false) ? 0.6 : 1.0,
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
    await Promise.resolve();

    const props = this.getProps();

    const signals = Array.isArray(input.data) ? input.data : [input.data];

    for (const signalData of signals) {
      const signal = signalData as UISignalPayload;
      const signalType = signal.type ?? signal.payload?.type;

      if (signalType === 'ui:change') {
        const checked = signal.payload?.checked ?? false;
        this.setState({ checked });
        props.onChange(checked);
      } else if (signalType === 'ui:focus') {
        this.setState({ focused: true });
      } else if (signalType === 'ui:blur') {
        this.setState({ focused: false });
      } else if (signalType === 'ui:hover') {
        this.setState({ hovered: true });
      } else if (signalType === 'ui:leave') {
        this.setState({ hovered: false });
      }
    }

    return undefined as TOutput;
  }
}
