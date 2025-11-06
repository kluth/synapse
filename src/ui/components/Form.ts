/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Form Component - Form container with validation
 */

import { InterneuronUI } from '../InterneuronUI';
import type { RenderSignal } from '../types';
import type { Input as NodeInput } from '../../types';

export interface FormProps {
  onSubmit: (data: Record<string, any>) => void;
  validation?: Record<string, (value: any) => string | null>;
  title?: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  submitting: boolean;
  submitted: boolean;
}

export class Form extends InterneuronUI<FormProps, FormState> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    const childSignals = this.orchestrateChildren();
    const childNodes = childSignals.map((signal) => signal.data.vdom);

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'form',
          props: {
            className: 'form',
            onSubmit: (e: Event) => e.preventDefault(),
          },
          children: [
            (props.title != null && props.title !== '') ? { tag: 'h2', children: [props.title] } : '',
            ...childNodes,
            {
              tag: 'button',
              props: {
                type: 'submit',
                disabled: state.submitting,
                className: 'form-submit',
              },
              children: [state.submitting ? 'Submitting...' : 'Submit'],
            },
          ],
        },
        styles: {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          opacity: state.submitting ? 0.7 : 1.0,
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
    // input.data can be single signal or array from processSignalQueue
    const signals: any = Array.isArray(input.data) ? input.data : [input.data];

    for (const signal of signals) {
      if (
        (signal != null && signal.type === 'ui:submit') ||
        (signal?.payload != null && signal.payload.type === 'ui:submit')
      ) {
        await this.handleSubmit();
      }
    }

    return undefined as TOutput;
  }

  private async handleSubmit(): Promise<void> {
    const props = this.getProps();
    const state = this.getState();

    this.setState({ submitting: true, errors: {} });

    // Validate
    if (props.validation != null) {
      const errors: Record<string, string> = {};

      for (const [field, validator] of Object.entries(props.validation)) {
        const error = validator(state.values[field]);
        if (error != null && error !== '') {
          errors[field] = error;
        }
      }

      if (Object.keys(errors).length > 0) {
        this.setState({ submitting: false, errors });
        return;
      }
    }

    // Submit
    try {
      void props.onSubmit(state.values);
      this.setState({ submitting: false, submitted: true });
    } catch (_err) {
      this.setState({
        submitting: false,
        errors: { _form: 'Submission failed' },
      });
    }
  }

  public setValue(field: string, value: any): void {
    const currentValues = this.getState().values;
    this.setState({
      values: { ...currentValues, [field]: value as Record<string, any>[string] },
    });
  }
}
