/**
 * Form Component - Form container with validation
 */

import { DermalLayer } from '../DermalLayer';
import type { RenderSignal, DermalLayerProps, DermalLayerState } from '../types';
import type { Input as NodeInput } from '../../types';

interface UISignalPayload {
  type?: string;
  payload?: {
    type?: string;
  };
}

export interface FormProps extends DermalLayerProps {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  validation?: Record<string, (value: unknown) => string | null>;
  title?: string;
}

export interface FormState extends DermalLayerState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  submitting: boolean;
  submitted: boolean;
}

export class DermalForm extends DermalLayer<FormProps, FormState> {
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
            props.title !== undefined && props.title !== ''
              ? { tag: 'h2', children: [props.title] }
              : '',
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
    const signals = Array.isArray(input.data) ? input.data : [input.data];

    for (const signalData of signals) {
      const signal = signalData as UISignalPayload;
      const signalType = signal.type ?? signal.payload?.type;

      if (signalType === 'ui:submit') {
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
    if (props.validation !== undefined) {
      const errors: Record<string, string> = {};

      for (const [field, validator] of Object.entries(props.validation)) {
        const error = validator(state.values[field]);
        if (error !== null && error !== '') {
          errors[field] = error;
        }
      }

      if (Object.keys(errors).length > 0) {
        this.setState({ submitting: false, errors });
        return;
      }
    }

    // Submit - await in case callback is async
    try {
      await Promise.resolve(props.onSubmit(state.values));
      this.setState({ submitting: false, submitted: true });
    } catch {
      this.setState({
        submitting: false,
        errors: { _form: 'Submission failed' },
      });
    }
  }

  public setValue(field: string, value: unknown): void {
    const currentValues = this.getState().values;
    this.setState({
      values: { ...currentValues, [field]: value },
    });
  }
}
