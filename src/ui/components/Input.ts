/**
 * Input Component - Text input field
 */

import { SensoryNeuron } from '../SensoryNeuron';
import type { RenderSignal } from '../types';
import type { Input as NodeInput } from '../../types';

interface UISignalPayload {
  type?: string;
  payload?: {
    type?: string;
    payload?: {
      value?: unknown;
    };
  };
  data?: {
    payload?: {
      value?: unknown;
    };
  };
}

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export interface InputState {
  focused: boolean;
  value: string;
  hasError: boolean;
}

export class Input extends SensoryNeuron<InputProps, InputState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: { className: 'input-wrapper' },
          children: [
            props.label !== undefined && props.label !== ''
              ? { tag: 'label', children: [props.label] }
              : '',
            {
              tag: 'input',
              props: {
                type: props.type ?? 'text',
                placeholder: props.placeholder,
                value: state.value,
                disabled: props.disabled,
                className: `input ${state.focused ? 'focused' : ''} ${
                  props.error !== undefined && props.error !== '' ? 'error' : ''
                }`,
                'aria-label': props.label ?? props.placeholder ?? '',
                'aria-invalid': String(props.error !== undefined && props.error !== ''),
              },
            },
            props.error !== undefined && props.error !== ''
              ? { tag: 'span', props: { className: 'error-message' }, children: [props.error] }
              : '',
          ],
        },
        styles: {
          borderColor:
            props.error !== undefined && props.error !== ''
              ? '#dc3545'
              : state.focused
                ? '#007bff'
                : '#ced4da',
          outline: state.focused ? '2px solid #007bff' : 'none',
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
    // Method is async to support future async operations
    await Promise.resolve();

    const props = this.getProps();

    // input.data can be single signal or array from processSignalQueue
    const signals = Array.isArray(input.data) ? input.data : [input.data];

    for (const signalData of signals) {
      const signal = signalData as UISignalPayload;
      const signalType = signal.type ?? signal.payload?.type;

      if (signalType === 'ui:focus') {
        this.setState({ focused: true });
      } else if (signalType === 'ui:blur') {
        this.setState({ focused: false });
      } else if (signalType === 'ui:input') {
        const rawValue = signal.payload?.payload?.value ?? signal.data?.payload?.value;
        const value =
          typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : '';
        this.setState({ value });
        props.onChange(value);
      }
    }

    return undefined as TOutput;
  }
}
