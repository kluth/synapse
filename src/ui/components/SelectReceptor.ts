/**
 * Select Component - Dropdown selection
 */

import { Receptor } from '../Receptor';
import type { RenderSignal, ReceptorProps, ReceptorState } from '../types';
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

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends ReceptorProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export interface SelectState extends ReceptorState {
  open: boolean;
  focused: boolean;
  selectedValue: string;
}

export class SelectReceptor extends Receptor<SelectProps, SelectState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: { className: 'select-wrapper' },
          children: [
            props.label !== undefined && props.label !== ''
              ? { tag: 'label', children: [props.label] }
              : '',
            {
              tag: 'select',
              props: {
                value: state.selectedValue,
                disabled: props.disabled,
                className: `select ${state.focused ? 'focused' : ''}`,
                'aria-label': props.label ?? 'Select an option',
              },
              children: [
                props.placeholder !== undefined && props.placeholder !== ''
                  ? { tag: 'option', props: { value: '' }, children: [props.placeholder] }
                  : '',
                ...props.options.map((opt) => ({
                  tag: 'option',
                  props: { value: opt.value },
                  children: [opt.label],
                })),
              ],
            },
          ],
        },
        styles: {
          borderColor: state.focused ? '#007bff' : '#ced4da',
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

      if (signalType === 'ui:change') {
        const rawValue = signal.payload?.payload?.value ?? signal.data?.payload?.value;
        const value =
          typeof rawValue === 'string' || typeof rawValue === 'number' ? String(rawValue) : '';
        this.setState({ selectedValue: value });
        props.onChange(value);
      } else if (signalType === 'ui:focus') {
        this.setState({ focused: true });
      } else if (signalType === 'ui:blur') {
        this.setState({ focused: false });
      }
    }

    return undefined as TOutput;
  }
}
