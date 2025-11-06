/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Input Component - Text input field
 */

import { SensoryNeuron } from '../SensoryNeuron';
import type { RenderSignal } from '../types';

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
            (props.label != null && props.label !== '') ? { tag: 'label', children: [props.label] } : '',
            {
              tag: 'input',
              props: {
                type: props.type ?? 'text',
                placeholder: props.placeholder,
                value: state.value,
                disabled: props.disabled,
                className: `input ${state.focused ? 'focused' : ''} ${(props.error != null && props.error !== '') ? 'error' : ''}`,
                'aria-label': props.label ?? props.placeholder ?? '',
                'aria-invalid': String(props.error != null && props.error !== ''),
              },
            },
            (props.error != null && props.error !== '') ? { tag: 'span', props: { className: 'error-message' }, children: [props.error] } : '',
          ],
        },
        styles: {
          borderColor: (props.error != null && props.error !== '') ? '#dc3545' : state.focused ? '#007bff' : '#ced4da',
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

  protected override executeProcessing<TInput = unknown, TOutput = unknown>(input: {
    data: TInput;
  }): Promise<TOutput> {
    const signal: any = input.data;
    const props = this.getProps();

    if (signal.type === 'ui:focus' || signal?.payload?.type === 'ui:focus') {
      this.setState({ focused: true });
    } else if (signal.type === 'ui:blur' || signal?.payload?.type === 'ui:blur') {
      this.setState({ focused: false });
    } else if (signal.type === 'ui:input' || signal?.payload?.type === 'ui:input') {
      const value = (signal?.payload?.payload?.value ?? signal?.data?.payload?.value ?? '') as string;
      this.setState({ value });
      props.onChange(value);
    }

    return Promise.resolve(undefined as TOutput);
  }
}
