/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Select Component - Dropdown selection
 */

import { SensoryNeuron } from '../SensoryNeuron';
import type { RenderSignal } from '../types';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export interface SelectState {
  open: boolean;
  focused: boolean;
  selectedValue: string;
}

export class Select extends SensoryNeuron<SelectProps, SelectState> {
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
            props.label ? { tag: 'label', children: [props.label] } : '',
            {
              tag: 'select',
              props: {
                value: state.selectedValue,
                disabled: props.disabled,
                className: `select ${state.focused ? 'focused' : ''}`,
                'aria-label': props.label || 'Select an option',
              },
              children: [
                props.placeholder ? { tag: 'option', props: { value: '' }, children: [props.placeholder] } : '',
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

  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(input: { data: TInput }): Promise<TOutput> {
    const signal: any = input.data;
    const props = this.getProps();

    if (signal.type === 'ui:change' || signal?.payload?.type === 'ui:change') {
      const value = signal?.payload?.payload?.value || signal?.data?.payload?.value || '';
      this.setState({ selectedValue: value });
      props.onChange(value);
    } else if (signal.type === 'ui:focus' || signal?.payload?.type === 'ui:focus') {
      this.setState({ focused: true });
    } else if (signal.type === 'ui:blur' || signal?.payload?.type === 'ui:blur') {
      this.setState({ focused: false });
    }

    return undefined as TOutput;
  }
}
