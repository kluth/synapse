/**
 * Radio Component - Single selection input
 */

import { Receptor } from '../Receptor';
import type { RenderSignal, VirtualDOMNode } from '../types';
import type { Input as NodeInput } from '../../types';

interface UISignalPayload {
  type?: string;
  payload?: {
    type?: string;
    value?: string;
  };
}

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export interface RadioState {
  selectedValue: string;
  focused: boolean;
}

export class Radio extends Receptor<RadioProps, RadioState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    const radioOptions: VirtualDOMNode[] = props.options.map((option: RadioOption) => ({
      tag: 'label',
      props: {
        className: 'radio-option',
        style: 'display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;',
      },
      children: [
        {
          tag: 'input',
          props: {
            type: 'radio',
            name: props.name,
            value: option.value,
            checked: state.selectedValue === option.value,
            disabled: props.disabled,
            style: 'margin-right: 8px; width: 16px; height: 16px; accent-color: #007bff;',
          },
        },
        {
          tag: 'span',
          props: {
            style: `color: ${(props.disabled ?? false) ? '#adb5bd' : '#212529'}; font-size: 14px;`,
          },
          children: [option.label],
        },
      ],
    }));

    const children: (string | VirtualDOMNode)[] | undefined =
      props.label !== undefined && props.label !== ''
        ? [
            {
              tag: 'legend',
              props: {
                style: 'font-weight: 600; margin-bottom: 8px; font-size: 14px;',
              },
              children: [props.label],
            },
            ...radioOptions,
          ]
        : radioOptions;

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'fieldset',
          props: {
            className: `radio-group ${state.focused ? 'focused' : ''}`,
            style: 'border: none; padding: 0; margin: 0;',
          },
          children,
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
        const value = signal.payload?.value ?? '';
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
